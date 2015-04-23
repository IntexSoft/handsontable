(function (Handsontable) {

  'use strict';

  var clonableINPUT = document.createElement('INPUT');
  clonableINPUT.className = 'htCheckboxRendererInput';
  clonableINPUT.type = 'checkbox';
  clonableINPUT.setAttribute('autocomplete', 'off');

  function applyPropertiesToCheckboxCell(cell, checkbox, value, cellProperties) {
    if (cellProperties.className) {
      if (cell.className) {
        cell.className = cell.className + " " + cellProperties.className;
      } else {
        cell.className = cellProperties.className;
      }
    }
    if (cellProperties.readOnly) {
      Handsontable.Dom.addClass(cell, cellProperties.readOnlyCellClassName);
    }
    checkbox.className = '';
    if (value === cellProperties.checkedTemplate || Handsontable.helper.stringify(cellProperties.checkedTemplate) === value) {
      checkbox.checked = true;
    } else if (value === cellProperties.uncheckedTemplate || Handsontable.helper.stringify(cellProperties.uncheckedTemplate) === value ) {
      checkbox.checked = false;
    } else {
      checkbox.className += ' noValue';
    }
    checkbox.disabled = cellProperties.readOnly || false;
  }

  var CheckboxRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
    var checkbox = TD.querySelector('input[type=checkbox]');
    cellProperties.checkedTemplate = true;
    cellProperties.uncheckedTemplate = false;
    if(checkbox) {
      applyPropertiesToCheckboxCell(TD, checkbox, value, cellProperties);
      return;
    }
    var eventManager = Handsontable.eventManager(TD);
    eventManager.clear();
    Handsontable.Dom.empty(TD); //TODO identify under what circumstances this line can be removed
    var INPUT = clonableINPUT.cloneNode(false); //this is faster than createElement
    TD.appendChild(INPUT);
    applyPropertiesToCheckboxCell(TD, INPUT, value, cellProperties);
    eventManager.addEventListener(INPUT,'mousedown',function (event) {
      Handsontable.helper.stopPropagation(event);
    });
    eventManager.addEventListener(INPUT,'mouseup',function (event) {
      Handsontable.helper.stopPropagation(event);
    });
    eventManager.addEventListener(INPUT,'change',function () {
      var row = instance.getCoords(this.parentNode).row;
      instance.setDataAtRowProp(row, prop, this.checked);
    });
    //We need to unbind the listener after the table has been destroyed
    instance.addHookOnce('afterDestroy', function () {
      eventManager.clear();
    });

    if(!instance.CheckboxRenderer || !instance.CheckboxRenderer.beforeKeyDownHookBound){
      instance.CheckboxRenderer = {
        beforeKeyDownHookBound : true
      };

      instance.addHook('beforeKeyDown', function(event){

        Handsontable.Dom.enableImmediatePropagation(event);

        if(event.keyCode == Handsontable.helper.keyCode.SPACE || event.keyCode == Handsontable.helper.keyCode.ENTER){

          var cell, checkbox, cellProperties;

          var selRange = instance.getSelectedRange();
          var topLeft = selRange.getTopLeftCorner();
          var bottomRight = selRange.getBottomRightCorner();

          for(var row = topLeft.row; row <= bottomRight.row; row++ ){
            for(var col = topLeft.col; col <= bottomRight.col; col++){
              cell = instance.getCell(row, col, true);
              cellProperties = instance.getCellMeta(row, col);

              checkbox = cell.querySelectorAll('input[type=checkbox]');

              if(checkbox.length > 0 && !cellProperties.readOnly){

                if(!event.isImmediatePropagationStopped()){
                  event.stopImmediatePropagation();
                  event.preventDefault();
                }

                for(var i = 0, len = checkbox.length; i < len; i++){
                  checkbox[i].checked = !checkbox[i].checked;
                  eventManager.fireEvent(checkbox[i], 'change');
                }

              }

            }
          }
        }
      });
    }

  };

  Handsontable.CheckboxRenderer = CheckboxRenderer;
  Handsontable.renderers.CheckboxRenderer = CheckboxRenderer;
  Handsontable.renderers.registerRenderer('checkbox', CheckboxRenderer);

})(Handsontable);
