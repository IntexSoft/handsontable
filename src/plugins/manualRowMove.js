/**
 * HandsontableManualRowMove
 *
 * Has 2 UI components:
 * - handle - the draggable element that sets the desired position of the row
 * - guide - the helper guide that shows the desired position as a horizontal guide
 *
 * Warning! Whenever you make a change in this file, make an analogous change in manualRowMove.js
 * @constructor
 */
(function (Handsontable) {
  function HandsontableManualRowMove() {

    var startRow,
      endRow,
      startY,
      startOffset,
      currentRow,
      currentTH,
      handle = document.createElement('DIV'),
      guide = document.createElement('DIV'),
      eventManager;

    handle.className = 'manualRowMover';
    guide.className = 'manualRowMoverGuide';

    var saveManualRowPositions = function () {
      var instance = this;
      Handsontable.hooks.run(instance, 'persistentStateSave', 'manualRowPositions', instance.manualRowPositions);
    };

    var loadManualRowPositions = function () {
      var instance = this,
        storedState = {};
      Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualRowPositions', storedState);
      return storedState.value;
    };

    function setupHandlePosition(TH) {
      instance = this;
      currentTH = TH;

      var row = this.view.wt.wtTable.getCoords(TH).row; //getCoords returns WalkontableCellCoords
      if (row >= 0) { //if not row header
        currentRow = row;
        var box = currentTH.getBoundingClientRect();
        startOffset = currentTH.offsetTop;
        handle.style.top = startOffset + 'px';
        handle.style.left = currentTH.offsetLeft + instance.view.wt.wtTable.holder.scrollLeft + 'px';
        instance.view.wt.wtTable.spreader.appendChild(handle);
      }
    }

    function refreshHandlePosition(TH, delta) {
      var box = TH.getBoundingClientRect();
      var handleHeight = box.height;
      if (delta > 0) {
        handle.style.top = (TH.offsetTop + box.height - handleHeight) + 'px';
      }
      else {
        handle.style.top = TH.offsetTop + 'px';
      }
    }

    function setupGuidePosition() {
      var instance = this;
      Handsontable.Dom.addClass(handle, 'active');
      Handsontable.Dom.addClass(guide, 'active');
      var box = currentTH.getBoundingClientRect();
      guide.style.width = instance.view.maximumVisibleElementWidth(0) - handle.offsetWidth  + 'px';
      guide.style.height = box.height + 'px';
      guide.style.top = startOffset + 'px';
      guide.style.left = parseInt(handle.style.left) + handle.offsetWidth + 'px';
      guide.style.zIndex = 105;
      instance.view.wt.wtTable.spreader.appendChild(guide);
    }

    function refreshGuidePosition(diff) {
      guide.style.top = handle.style.top;
    }

    function removeHandleAndGuide() {
      handle.parentNode.removeChild(handle);
      guide.parentNode.removeChild(guide);
    }

    function hideHandleAndGuide() {
      Handsontable.Dom.removeClass(handle, 'active');
      Handsontable.Dom.removeClass(guide, 'active');
    }

    var checkRowHeader = function (element) {
      if (element.tagName != 'BODY') {
        if (element.parentNode.tagName == 'TBODY') {
          return true;
        } else {
          element = element.parentNode;
          return checkRowHeader(element);
        }
      }
      return false;
    };

    var getTHFromTargetElement = function (element) {
      if (element.tagName != 'TABLE') {
        if (element.tagName == 'TH') {
          return element;
        } else {
          return getTHFromTargetElement(element.parentNode);
        }
      }
      return null;
    };

    var bindEvents = function () {
      var instance = this;
      var pressed;
      var allowDrop = true;
      var allowMove = true;

      eventManager.addEventListener(instance.rootElement, 'mouseover', function (e) {
        if (checkRowHeader(e.target)) {
          var th = getTHFromTargetElement(e.target);
          if (th) {
            endRow = instance.view.wt.wtTable.getCoords(th).row;
            if (pressed) {
              var notAllowedDrop = instance.getSettings().onRowMove(endRow, startRow);
              if (notAllowedDrop) {
                handle.style.cursor = 'no-drop';
                allowDrop = false;
              } else {
                handle.style.cursor = 'auto';
                allowDrop = true;
              }
              refreshHandlePosition(th, endRow - startRow);
            }
            else {
              if (!isNaN(endRow)) {
                var notAllowedMove = instance.getSettings().onOverRowMoveHandler(endRow, startRow);
                if (notAllowedMove) {
                  handle.style.cursor = 'no-drop';
                  allowMove = false;
                } else {
                  handle.style.cursor = 'move';
                  allowMove = true;
                }
              }
              setupHandlePosition.call(instance, th);
            }
          }
        }
      });

      eventManager.addEventListener(instance.rootElement, 'mousedown', function (e) {
        if (Handsontable.Dom.hasClass(e.target, 'manualRowMover') && allowMove) {
          startY = Handsontable.helper.pageY(e);
          setupGuidePosition.call(instance);
          pressed = instance;
          startRow = currentRow;
          endRow = currentRow;
        }
      });

      eventManager.addEventListener(window, 'mousemove', function (e) {
        if (pressed) {
          refreshGuidePosition();
        }
      });

      eventManager.addEventListener(window, 'mouseup', function (e) {
        instance.rootElement.style.cursor = 'normal';
        if (pressed) {
          hideHandleAndGuide();
          removeHandleAndGuide();
          pressed = false;
          if (allowDrop && startRow !== endRow) {
            Handsontable.hooks.run(instance, 'afterRowMove', startRow, endRow);
          }
          setupHandlePosition.call(instance, currentTH);
        }
      });

    };

    var createPositionData = function (positionArr, len) {
      if (positionArr.length < len) {
        for (var i = positionArr.length; i < len; i++) {
          positionArr[i] = i;
        }
      }
    };

    this.beforeInit = function () {
      this.manualRowPositions = [];
    };

    this.init = function (source) {
      var instance = this;
      eventManager = Handsontable.eventManager(instance);
      var manualRowMoveEnabled = !!(instance.getSettings().manualRowMove);

      if (manualRowMoveEnabled) {
        var initialManualRowPositions = instance.getSettings().manualRowMove;
        var loadedManualRowPostions = loadManualRowPositions.call(instance);

        // update plugin usages count for manualColumnPositions
        if (typeof instance.manualRowPositionsPluginUsages != 'undefined') {
          instance.manualRowPositionsPluginUsages.push('manualColumnMove');
        } else {
          instance.manualRowPositionsPluginUsages = ['manualColumnMove'];
        }

        if (typeof loadedManualRowPostions != 'undefined') {
          this.manualRowPositions = loadedManualRowPostions;
        } else if (Array.isArray(initialManualRowPositions)) {
          this.manualRowPositions = initialManualRowPositions;
        } else {
          this.manualRowPositions = [];
        }

        if (source === 'afterInit') {
          bindEvents.call(this);
          if (this.manualRowPositions.length > 0) {
            instance.forceFullRender = true;
            instance.render();
          }
        }
      } else {
        var pluginUsagesIndex = instance.manualRowPositionsPluginUsages ? instance.manualRowPositionsPluginUsages.indexOf('manualColumnMove') : -1;
        if (pluginUsagesIndex > -1) {
          unbindEvents.call(this);
          instance.manualRowPositions = [];
          instance.manualRowPositionsPluginUsages[pluginUsagesIndex] = void 0;
        }
      }

    };

    this.modifyRow = function (row) {
      var instance = this;
      if (instance.getSettings().manualRowMove) {
        if (typeof instance.manualRowPositions[row] === 'undefined') {
          createPositionData(this.manualRowPositions, row + 1);
        }
        return instance.manualRowPositions[row];
      }

      return row;
    };
  }

  var htManualRowMove = new HandsontableManualRowMove();

  Handsontable.hooks.add('beforeInit', htManualRowMove.beforeInit);
  Handsontable.hooks.add('afterInit', function () {
    htManualRowMove.init.call(this, 'afterInit');
  });

  Handsontable.hooks.add('afterUpdateSettings', function () {
    htManualRowMove.init.call(this, 'afterUpdateSettings');
  });

  Handsontable.hooks.add('modifyRow', htManualRowMove.modifyRow);
  Handsontable.hooks.register('afterRowMove');

})(Handsontable);
