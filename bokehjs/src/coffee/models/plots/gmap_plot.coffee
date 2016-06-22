_ = require "underscore"
proj4 = require "proj4"
toProjection = proj4.defs('GOOGLE')

GMapPlotCanvas = require "./gmap_plot_canvas"
Plot = require "./plot"
p = require "../../core/properties"

class GMapPlotView extends Plot.View


class GMapPlot extends Plot.Model
  type: 'GMapPlot'
  default_view: GMapPlotView

  initialize: (options) ->
    super(options)
    @_plot_canvas = new GMapPlotCanvas.Model({plot: @})
    @plot_canvas.toolbar = @toolbar

  # Set all the PlotCanvas properties as internal.
  # This seems to be necessary so that everything can initialize.
  # Feels very clumsy, but I'm not sure how the properties system wants
  # to handle something like this situation.
  @define {
    map_options: [ p.Any ]
  }

module.exports =
  Model: GMapPlot
  View: GMapPlotView
