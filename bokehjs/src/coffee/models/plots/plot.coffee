PlotCanvas = require "../plots/plot_canvas"


class PlotView extends PlotCanvas.View


class Plot extends PlotCanvas.Model
  type: 'Plot'
  default_view: PlotView


module.exports =
  View: PlotView
  Model: Plot
  get_size_for_available_space: PlotCanvas.get_size_for_available_space
