import {Renderer, RendererView} from "./renderer"
import {GlyphRenderer, GlyphRendererView} from "./glyph_renderer"
import {LayoutProvider} from "../graphs/layout_provider"
import {GraphHitTestPolicy, NodesOnly} from "../graphs/graph_hit_test_policy"
import {Scale} from "../scales/scale"
import * as p from "core/properties"
import {build_views} from "core/build_views"
import {SelectionManager} from "core/selection_manager"

export class GraphRendererView extends RendererView {
  model: GraphRenderer

  node_view: GlyphRendererView
  edge_view: GlyphRendererView

  xscale: Scale
  yscale: Scale

  protected _renderer_views: {[key: string]: GlyphRendererView}

  initialize(options: any): void {
    super.initialize(options)

    this.xscale = this.plot_view.frame.xscales["default"]
    this.yscale = this.plot_view.frame.yscales["default"]

    this._renderer_views = {}
    ;[this.node_view, this.edge_view] = build_views(this._renderer_views,
      [this.model.node_renderer, this.model.edge_renderer], this.plot_view.view_options()) as [GlyphRendererView, GlyphRendererView]

    this.set_data()
  }

  connect_signals(): void {
    super.connect_signals()

    this.connect(this.model.layout_provider.change, () => this.set_data())
    this.connect(this.model.node_renderer.data_source._select, () => this.set_data())
    this.connect(this.model.node_renderer.data_source.inspect, () => this.set_data())
    this.connect(this.model.node_renderer.data_source.change, () => this.set_data())
    this.connect(this.model.edge_renderer.data_source._select, () => this.set_data())
    this.connect(this.model.edge_renderer.data_source.inspect, () => this.set_data())
    this.connect(this.model.edge_renderer.data_source.change, () => this.set_data())

    const {x_ranges, y_ranges} = this.plot_model.frame

    for (const name in x_ranges) {
      const rng = x_ranges[name]
      this.connect(rng.change, () => this.set_data())
    }

    for (const name in y_ranges) {
      const rng = y_ranges[name]
      this.connect(rng.change, () => this.set_data())
    }
  }

  set_data(request_render: boolean = true): void {
    // TODO (bev) this is a bit clunky, need to make sure glyphs use the correct ranges when they call
    // mapping functions on the base Renderer class
    this.node_view.glyph.model.setv({x_range_name: this.model.x_range_name, y_range_name: this.model.y_range_name}, {silent: true})
    this.edge_view.glyph.model.setv({x_range_name: this.model.x_range_name, y_range_name: this.model.y_range_name}, {silent: true})

    // XXX
    const node_glyph: any = this.node_view.glyph
    ;[node_glyph._x, node_glyph._y] =
      this.model.layout_provider.get_node_coordinates(this.model.node_renderer.data_source) as any

    const edge_glyph: any = this.edge_view.glyph
    ;[edge_glyph._xs, edge_glyph._ys] =
      this.model.layout_provider.get_edge_coordinates(this.model.edge_renderer.data_source) as any

    node_glyph.index_data()
    edge_glyph.index_data()

    if (request_render)
      this.request_render()
  }

  render(): void {
    this.edge_view.render()
    this.node_view.render()
  }
}

export namespace GraphRenderer {
  export interface Attrs extends Renderer.Attrs {
    x_range_name: string
    y_range_name: string
    layout_provider: LayoutProvider
    node_renderer: GlyphRenderer
    edge_renderer: GlyphRenderer
    selection_policy: GraphHitTestPolicy
    inspection_policy: GraphHitTestPolicy
  }

  export interface Props extends Renderer.Props {}
}

export interface GraphRenderer extends GraphRenderer.Attrs {}

export class GraphRenderer extends Renderer {

  properties: GraphRenderer.Props

  constructor(attrs?: Partial<GraphRenderer.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'GraphRenderer'
    this.prototype.default_view = GraphRendererView

    this.define({
      x_range_name:       [ p.String,        'default'              ],
      y_range_name:       [ p.String,        'default'              ],
      layout_provider:    [ p.Instance                              ],
      node_renderer:      [ p.Instance                              ],
      edge_renderer:      [ p.Instance                              ],
      selection_policy:   [ p.Instance,      () => new NodesOnly()  ],
      inspection_policy:  [ p.Instance,      () => new NodesOnly()  ],
    })

    this.override({
      level: 'glyph',
    })
  }

  get_selection_manager(): SelectionManager {
    return this.node_renderer.data_source.selection_manager
  }
}
GraphRenderer.initClass()
