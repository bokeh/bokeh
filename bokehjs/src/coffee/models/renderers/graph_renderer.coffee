import {Circle} from "../glyphs/circle"
import {MultiLine} from "../glyphs/multi_line"
import {GraphDataSource} from "../graphs/graph_data_source"
import {Renderer, RendererView} from "../renderers/renderer"
import * as p from "core/properties"

export class GraphRendererView extends RendererView

  initialize: (options) ->
    super(options)
    @nodes = @build_glyph_view(@model.nodes)
    @edges = @build_glyph_view(@model.edges)

  connect_signals: () ->
    super()
    @connect(@model.change, () -> @request_render())

  build_glyph_view: (model) ->
    new model.default_view({model: model, renderer: @, plot_view: @plot_view, parent: @})

  set_data: () ->
    # TODO (bev) this is a bit clunky, need to make sure glyphs use the correct ranges when they call
    # mapping functions on the base Renderer class
    @nodes.model.setv({x_range_name: @model.x_range_name, y_range_name: @model.y_range_name}, {silent: true})
    @nodes.set_data(@graph_source.nodes, new Array())
    @nodes.set_visuals(@graph_source.nodes)

    @edges.model.setv({x_range_name: @model.x_range_name, y_range_name: @model.y_range_name}, {silent: true})
    @edges.set_data(@graph_source.edges, new Array())
    @edges.set_visuals(@graph_source.edges)

  render: () ->
    ctx = @plot_view.canvas_view.ctx

    @nodes.render(ctx, indices, @nodes)
    @edges.render(ctx, indices, @edges)

export class GraphRenderer extends Renderer
  default_view: GraphRendererView
  type: 'GraphRenderer'

  @define {
      x_range_name:    [ p.String,   "default"        ]
      y_range_name:    [ p.String,   "default"        ]
      graph_source:    [ p.Instance, () -> new GraphDataSource() ]
      nodes:           [ p.Instance, () -> new Circle()          ]
      edges:           [ p.Instance, () -> new MultiLine()       ]
    }

  @override {
    level: 'glyph'
  }
