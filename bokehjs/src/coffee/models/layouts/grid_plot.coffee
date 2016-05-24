p = require "../../core/properties"

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
    @spacing = @border_space

  @define {
    border_space: [ p.Number, 0 ]
    toolbar_location: [ p.Location, 'left' ]
  }

module.exports =
  View: GridPlotView
  Model: GridPlot
