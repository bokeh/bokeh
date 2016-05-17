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
    plot_canvas_options = _.omit(options, ['plot_width', 'plot_height', 'toolbar_location'])
    @_plot_canvas = new GMapPlotCanvas.Model(plot_canvas_options)
    @_plot_canvas.toolbar = @toolbar
    @_plot_canvas.width = @plot_width
    @_plot_canvas.height = @plot_height

  _doc_attached: () ->
    @_plot_canvas.attach_document(@document)

  @internal {
      map_options: [ p.Any ]
    }

module.exports =
  Model: GMapPlot
  View: GMapPlotView
