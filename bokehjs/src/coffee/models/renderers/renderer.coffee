Model = require "../../model"
BokehView = require "../../core/bokeh_view"

class RendererView extends BokehView

  initialize: (options) ->
    @plot_model = options.plot_model
    @plot_view = options.plot_view

  bind_bokeh_events: () ->

  request_render: () ->
    @plot_view.request_render()

class Renderer extends Model
  type: "Renderer"

module.exports =
  Model: Renderer
  View: RendererView
