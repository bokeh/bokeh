import {Renderer, RendererView} from "../renderers/renderer"
import {NodesOnly} from "../graphs/graph_hit_test_policy"

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
    if not @model.visible
      return false

    did_hit = false

    if mode == "select"
      did_hit = @model.selection_policy?.do_selection(geometry, @, final, append)
    else # if mode == "inspect"
      did_hit = @model.inspection_policy?.do_inspection(geometry, @, final, append)

    return did_hit


export class GraphRenderer extends Renderer
  default_view: GraphRendererView
  type: 'GraphRenderer'

  get_selection_manager: () ->
    return @node_renderer.data_source.selection_manager

  @define {
      x_range_name:       [ p.String,        'default'              ]
      y_range_name:       [ p.String,        'default'              ]
      layout_provider:    [ p.Instance                              ]
      node_renderer:      [ p.Instance                              ]
      edge_renderer:      [ p.Instance                              ]
      selection_policy:   [ p.Instance,      () -> new NodesOnly()  ]
      inspection_policy:  [ p.Instance,      () -> new NodesOnly()  ]
    }

  @override {
    level: 'glyph'
  }
