Plot = require "../plots/plot"
WebGLPlotCanvas = require "./webgl_plot_canvas"

class WebGLPlotView extends Plot.View

class WebGLPlot extends Plot.Model
  type: 'WebGLPlot'
  default_view: WebGLPlotView

  _plot_canvas_factory: () -> new WebGLPlotCanvas.Model({plot: @})

module.exports = {
  Model: WebGLPlot
  View: WebGLPlotView
}
