_ = require "underscore"
proj4 = require "proj4"
toProjection = proj4.defs('GOOGLE')
{logger} = require "../../core/logging"

GMapPlotCanvas = require "./gmap_plot_canvas"
Plot = require "./plot"
p = require "../../core/properties"

class GMapPlotView extends Plot.View


class GMapPlot extends Plot.Model
  type: 'GMapPlot'
  default_view: GMapPlotView

  initialize: (options) ->
    super(options)
    if not @api_key
      logger.error("key is required. Google Maps API now requires an API key: http://googlegeodevelopers.blogspot.mx/2016/06/building-for-scale-updates-to-google.html")
    @_plot_canvas = new GMapPlotCanvas.Model({plot: @})
    @plot_canvas.toolbar = @toolbar

  # Set all the PlotCanvas properties as internal.
  # This seems to be necessary so that everything can initialize.
  # Feels very clumsy, but I'm not sure how the properties system wants
  # to handle something like this situation.
  @define {
    map_options: [ p.Any ]
    api_key: [ p.String ]
  }

module.exports =
  Model: GMapPlot
  View: GMapPlotView
