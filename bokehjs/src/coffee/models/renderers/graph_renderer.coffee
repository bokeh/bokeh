import {Renderer, RendererView} from "../renderers/renderer"

import * as p from "core/properties"
import {build_views} from "core/build_views"
import {contains} from "core/util/array"
import {create_hit_test_result} from "core/hittest"

export class GraphRendererView extends RendererView

  initialize: (options) ->
    super(options)

    @xscale = @plot_view.frame.xscales["default"]
    @yscale = @plot_view.frame.yscales["default"]

    @_renderer_views = {}
    [@node_view, @edge_view] = build_views(@_renderer_views,
                                           [@model.node_renderer, @model.edge_renderer],
                                           @plot_view.view_options())

    @set_data()

  connect_signals: () ->
    super()
    @connect(@model.layout_provider.change, () -> @set_data())
    @connect(@model.node_renderer.data_source.select, () -> @set_data())
    @connect(@model.node_renderer.data_source.inspect, () -> @set_data())
    @connect(@model.edge_renderer.data_source.select, () -> @set_data())
    @connect(@model.edge_renderer.data_source.inspect, () -> @set_data())

  set_data: (request_render=true) ->
    # TODO (bev) this is a bit clunky, need to make sure glyphs use the correct ranges when they call
    # mapping functions on the base Renderer class
    @node_view.glyph.model.setv({x_range_name: @model.x_range_name, y_range_name: @model.y_range_name}, {silent: true})
    @edge_view.glyph.model.setv({x_range_name: @model.x_range_name, y_range_name: @model.y_range_name}, {silent: true})

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

      if @selection_mode == "linked"
        node_indices = (@node_renderer.data_source.data.index[i] for i in indices["1d"].indices)
        edge_source = @edge_renderer.data_source
        edge_indices = []
        for i in [0...edge_source.data.start.length]
          if contains(node_indices, edge_source.data.start[i]) or contains(node_indices, edge_source.data.end[i])
            edge_indices.push(i)

        linked_index = create_hit_test_result()
        for i in edge_indices
          linked_index["2d"].indices[i] = [0]

        edge_selector = @edge_renderer.data_source.selection_manager.selector
        edge_selector.update(linked_index, final, append)
        @edge_renderer.data_source.selected = edge_selector.indices
        @edge_renderer.data_source.select.emit()

    else ## if mode=="inspect"
      inspector = @node_renderer.data_source.selection_manager.inspectors[@id]
      inspector.update(indices, true, false, true)
      @node_renderer.data_source.inspected = inspector.indices

      if @inspection_mode == "linked"
        node_indices = (@node_renderer.data_source.data.index[i] for i in indices["1d"].indices)
        edge_source = @edge_renderer.data_source
        edge_indices = []
        for i in [0...edge_source.data.start.length]
          if contains(node_indices, edge_source.data.start[i]) or contains(node_indices, edge_source.data.end[i])
            edge_indices.push(i)

        linked_index = create_hit_test_result()
        for i in edge_indices
          linked_index["2d"].indices[i] = [0]

        # manually get or create inspector
        @edge_renderer.data_source.selection_manager._set_inspector(@edge_renderer)
        edge_inspector = @edge_renderer.data_source.selection_manager.inspectors[@edge_renderer.id]
        edge_inspector.update(linked_index, final, append)
        @edge_renderer.data_source.inspected = edge_inspector.indices
        @edge_renderer.data_source.inspect.emit()

    return not indices.is_empty()

  get_selection_manager: () ->
    return @node_renderer.data_source.selection_manager

  @define {
      x_range_name:    [ p.String,        'default'              ]
      y_range_name:    [ p.String,        'default'              ]
      layout_provider: [ p.Instance                              ]
      node_renderer:   [ p.Instance                              ]
      edge_renderer:   [ p.Instance                              ]
      selection_mode:  [ p.String,        'default'              ]
      inspection_mode: [ p.String,        'default'              ]
    }

  @override {
    level: 'glyph'
  }
