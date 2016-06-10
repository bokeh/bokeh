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
    plot_options = _.omit(options, 'map_options')
    super(plot_options)
    @_plot_canvas = new GMapPlotCanvas.Model(options)
    @_plot_canvas.toolbar = @toolbar
    @_set_orientation_variables(@_plot_canvas)

  _doc_attached: () ->
    # XXXXXX prob wrong
    @_plot_canvas._attach_document(@document)

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
