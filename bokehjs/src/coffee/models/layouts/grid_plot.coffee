Box = require "./box"


class GridPlotView extends Box.View
  className: "bk-grid-plot"


class GridPlot extends Box.Model
  type: 'GridPlot'
  default_view: GridPlotView

  constructor: (attrs, options) ->
    super(attrs, options)
    @_horizontal = false
    if @toolbar_location in ['left', 'right']
      @_horizontal = true

module.exports =
  View: GridPlotView
  Model: GridPlot
