import {Renderer, RendererView} from "../renderers/renderer"

import * as p from "core/properties"
import {build_views} from "core/build_views"

export class GraphRendererView extends RendererView

  initialize: (options) ->
    super(options)

    @_renderer_views = {}
    @node_view = build_views(@_renderer_views, [@model.node_renderer,], @plot_view.view_options())[0]
    @edge_view = build_views(@_renderer_views, [@model.edge_renderer,], @plot_view.view_options())[0]

    @set_data()

  connect_signals: () ->
    super()
    @connect(@model.layout_provider.change, () -> @set_data())

  set_data: (request_render=true) ->
    [@node_view.glyph._x, @node_view.glyph._y] = @model.layout_provider.get_node_coordinates(@model.node_renderer.data_source)
    [@edge_view.glyph._xs, @edge_view.glyph._ys] = @model.layout_provider.get_edge_coordinates(@model.edge_renderer.data_source)

    if request_render
      @request_render()

  render: () ->
    @edge_view.render()
    @node_view.render()


export class GraphRenderer extends Renderer
  default_view: GraphRendererView
  type: 'GraphRenderer'

  @define {
      layout_provider: [ p.Instance                              ]
      node_renderer:   [ p.Instance                              ]
      edge_renderer:   [ p.Instance                              ]
    }

  @override { # todo prop into renderers?
    level: 'glyph'
  }
