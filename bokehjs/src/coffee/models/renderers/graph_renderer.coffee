import {Renderer, RendererView} from "../renderers/renderer"

import * as p from "core/properties"
import {build_views} from "core/build_views"

export class GraphRendererView extends RendererView

  initialize: (options) ->
    super(options)

    @xscale = @plot_view.frame.xscales["default"]
    @yscale = @plot_view.frame.yscales["default"]

    @_renderer_views = {}
    @node_view = build_views(@_renderer_views, [@model.node_renderer,], @plot_view.view_options())[0]
    @edge_view = build_views(@_renderer_views, [@model.edge_renderer,], @plot_view.view_options())[0]

    @set_data()

  connect_signals: () ->
    super()
    @connect(@model.layout_provider.change, () -> @set_data())
    @connect(@model.node_renderer.data_source.select, () -> @set_data())

  set_data: (request_render=true) ->
    [@node_view.glyph._x, @node_view.glyph._y] = @model.layout_provider.get_node_coordinates(@model.node_renderer.data_source)
    [@edge_view.glyph._xs, @edge_view.glyph._ys] = @model.layout_provider.get_edge_coordinates(@model.edge_renderer.data_source)

    @node_view.glyph.index = @node_view.glyph._index_data()
    @edge_view.glyph.index = @edge_view.glyph._index_data()

    if request_render
      @request_render()

  render: () ->
    @edge_view.render()
    @node_view.render()

  hit_test: (geometry) ->
    return @model.hit_test_helper(geometry, @node_view.glyph)


export class GraphRenderer extends Renderer
  default_view: GraphRendererView
  type: 'GraphRenderer'

  # TODO (bev) this is just to make testing easier. Might be better on a view model
  hit_test_helper: (geometry, glyph) ->
    if @visible
      return glyph.hit_test(geometry)
    else
      return null

  @define {
      layout_provider: [ p.Instance                              ]
      node_renderer:   [ p.Instance                              ]
      edge_renderer:   [ p.Instance                              ]
    }

  @override { # todo prop into renderers?
    level: 'glyph'
  }
