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

  hit_test: (geometry, final, append, mode="select") ->
    return @model.hit_test_helper(geometry, @node_view.glyph, final, append, mode)


export class GraphRenderer extends Renderer
  default_view: GraphRendererView
  type: 'GraphRenderer'

  hit_test_helper: (geometry, glyph, final, append, mode) ->
    if not @visible
      return false

    hit_test_result = glyph.hit_test(geometry)

    # glyphs that don't have hit-testing implemented will return null
    if hit_test_result == null
      return false

    indices = @node_renderer.view.convert_selection_from_subset(hit_test_result)

    if mode == "select"
      selector = @node_renderer.data_source.selection_manager.selector
      selector.update(indices, final, append)
      @node_renderer.data_source.selected = selector.indices
    else ## if mode=="inspect"
      inspector = @node_renderer.data_source.selection_manager.inspectors[@id]
      inspector.update(indices, true, false, true)
      @node_renderer.data_source.inspected = inspector.indices

    return not indices.is_empty()

  get_selection_manager: () ->
    return @node_renderer.data_source.selection_manager

  @define {
      x_range_name:    [ p.String,        'default'              ]
      y_range_name:    [ p.String,        'default'              ]
      layout_provider: [ p.Instance                              ]
      node_renderer:   [ p.Instance                              ]
      edge_renderer:   [ p.Instance                              ]
    }

  @override { # todo prop into renderers?
    level: 'glyph'
  }
