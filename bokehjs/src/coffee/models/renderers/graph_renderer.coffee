import {Circle} from "../glyphs/circle"
import {MultiLine} from "../glyphs/multi_line"
import {GraphDataSource} from "../graphs/graph_data_source"
import {Renderer, RendererView} from "../renderers/renderer"

import * as p from "core/properties"
import {range} from "core/util/array"

export class GraphRendererView extends RendererView

  initialize: (options) ->
    super(options)
    @edges = @build_glyph_view(@model.edges)
    @nodes = @build_glyph_view(@model.nodes)

    # hackery
    @edges._index_data = () -> null

    @set_data()

  connect_signals: () ->
    super()
    @connect(@model.change, () -> @request_render())

  build_glyph_view: (model) ->
    new model.default_view({model: model, renderer: @, plot_view: @plot_view, parent: @})

  set_data: () ->
    # TODO (bev) this is a bit clunky, need to make sure glyphs use the correct ranges when they call
    # mapping functions on the base Renderer class
    @edges.model.setv({x_range_name: @model.x_range_name, y_range_name: @model.y_range_name}, {silent: true})
    @edges.set_data(@model.graph_source.edges)
    @edges.set_visuals(@model.graph_source.edges)

    @nodes.model.setv({x_range_name: @model.x_range_name, y_range_name: @model.y_range_name}, {silent: true})
    @nodes.set_data(@model.graph_source.nodes)
    @nodes.set_visuals(@model.graph_source.nodes)

    [@edges._xs, @edges._ys] = @model.layout_provider.get_edge_locations(@model.graph_source)
    [@nodes._x, @nodes._y] = @model.layout_provider.get_node_locations(@model.graph_source)

  render: () ->
    @edges.map_data()
    @nodes.map_data()

    ctx = @plot_view.canvas_view.ctx
    edge_indices = range(@edges.sxs.length)
    node_indices = range(@nodes.sx.length)

    @edges.render(ctx, edge_indices, @edges)
    @nodes.render(ctx, node_indices, @nodes)

export class GraphRenderer extends Renderer
  default_view: GraphRendererView
  type: 'GraphRenderer'

  @define {
      x_range_name:    [ p.String,   "default"        ]
      y_range_name:    [ p.String,   "default"        ]
      graph_source:    [ p.Instance, () -> new GraphDataSource() ]
      nodes:           [ p.Instance, () -> new Circle()          ]
      edges:           [ p.Instance, () -> new MultiLine()       ]
      layout_provider: [ p.Instance                   ]
    }

  @override {
    level: 'glyph'
  }
