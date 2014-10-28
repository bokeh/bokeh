(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "CellRangeSelector": CellRangeSelector
    }
  });


  function CellRangeSelector(options) {
    var _grid;
    var _canvas;
    var _dragging;
    var _decorator;
    var _self = this;
    var _handler = new Slick.EventHandler();
    var _defaults = {
      selectionCss: {
        "border": "2px dashed blue"
      }
    };


    function init(grid) {
      options = $.extend(true, {}, _defaults, options);
      _decorator = new Slick.CellRangeDecorator(grid, options);
      _grid = grid;
      _canvas = _grid.getCanvasNode();
      _handler
        .subscribe(_grid.onDragInit, handleDragInit)
        .subscribe(_grid.onDragStart, handleDragStart)
        .subscribe(_grid.onDrag, handleDrag)
        .subscribe(_grid.onDragEnd, handleDragEnd);
    }

    function destroy() {
      _handler.unsubscribeAll();
    }

    function handleDragInit(e, dd) {
      // prevent the grid from cancelling drag'n'drop by default
      e.stopImmediatePropagation();
    }

    function handleDragStart(e, dd) {
      var cell = _grid.getCellFromEvent(e);
      if (_self.onBeforeCellRangeSelected.notify(cell) !== false) {
        if (_grid.canCellBeSelected(cell.row, cell.cell)) {
          _dragging = true;
          e.stopImmediatePropagation();
        }
      }
      if (!_dragging) {
        return;
      }

      _grid.focus();

      var start = _grid.getCellFromPoint(
          dd.startX - $(_canvas).offset().left,
          dd.startY - $(_canvas).offset().top);

      dd.range = {start: start, end: {}};

      return _decorator.show(new Slick.Range(start.row, start.cell));
    }

    function handleDrag(e, dd) {
      if (!_dragging) {
        return;
      }
      e.stopImmediatePropagation();

      var end = _grid.getCellFromPoint(
          e.pageX - $(_canvas).offset().left,
          e.pageY - $(_canvas).offset().top);

      if (!_grid.canCellBeSelected(end.row, end.cell)) {
        return;
      }

      dd.range.end = end;
      _decorator.show(new Slick.Range(dd.range.start.row, dd.range.start.cell, end.row, end.cell));
    }

    function handleDragEnd(e, dd) {
      if (!_dragging) {
        return;
      }

      _dragging = false;
      e.stopImmediatePropagation();

      _decorator.hide();
      _self.onCellRangeSelected.notify({
        range: new Slick.Range(
            dd.range.start.row,
            dd.range.start.cell,
            dd.range.end.row,
            dd.range.end.cell
        )
      });
    }

    $.extend(this, {
      "init": init,
      "destroy": destroy,

      "onBeforeCellRangeSelected": new Slick.Event(),
      "onCellRangeSelected": new Slick.Event()
    });
  }
})(jQuery);