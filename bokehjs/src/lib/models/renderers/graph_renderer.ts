import {DataRenderer, DataRendererView} from "./data_renderer"
import {GlyphRenderer, GlyphRendererView} from "./glyph_renderer"
import {LayoutProvider} from "../graphs/layout_provider"
import {GraphHitTestPolicy, NodesOnly} from "../graphs/graph_hit_test_policy"
import {Scale} from "../scales/scale"
import * as p from "core/properties"
import {build_views, remove_views} from "core/build_views"
import {SelectionManager} from "core/selection_manager"

export class GraphRendererView extends DataRendererView {
  model: GraphRenderer

  node_view: GlyphRendererView
  edge_view: GlyphRendererView

  xscale: Scale
  yscale: Scale

  protected _renderer_views: Map<GlyphRenderer, GlyphRendererView>

  initialize(): void {
    super.initialize()

    this.xscale = this.plot_view.frame.xscales.default
    this.yscale = this.plot_view.frame.yscales.default

    this._renderer_views = new Map()
  }

  async lazy_initialize(): Promise<void> {
    [this.node_view, this.edge_view] = await build_views(this._renderer_views, [
      this.model.node_renderer,
      this.model.edge_renderer,
    ], {parent: this.parent})

    this.set_data()
  }

  remove(): void {
    remove_views(this._renderer_views)
    super.remove()
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

    const {x_ranges, y_ranges} = this.plot_view.frame

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

  protected _render(): void {
    this.edge_view.render()
    this.node_view.render()
  }
}

export namespace GraphRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataRenderer.Props & {
    layout_provider: p.Property<LayoutProvider>
    node_renderer: p.Property<GlyphRenderer>
    edge_renderer: p.Property<GlyphRenderer>
    selection_policy: p.Property<GraphHitTestPolicy>
    inspection_policy: p.Property<GraphHitTestPolicy>
  }
}

export interface GraphRenderer extends GraphRenderer.Attrs {}

export class GraphRenderer extends DataRenderer {
  properties: GraphRenderer.Props
  __view_type__: GraphRendererView

  constructor(attrs?: Partial<GraphRenderer.Attrs>) {
    super(attrs)
  }

  static init_GraphRenderer(): void {
    this.prototype.default_view = GraphRendererView

    this.define<GraphRenderer.Props>({
      layout_provider:    [ p.Instance                              ],
      node_renderer:      [ p.Instance                              ],
      edge_renderer:      [ p.Instance                              ],
      selection_policy:   [ p.Instance,      () => new NodesOnly()  ],
      inspection_policy:  [ p.Instance,      () => new NodesOnly()  ],
    })
  }

  get_selection_manager(): SelectionManager {
    return this.node_renderer.data_source.selection_manager
  }
}
