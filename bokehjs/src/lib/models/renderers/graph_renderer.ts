import {DataRenderer, DataRendererView} from "./data_renderer"
import {GlyphRenderer, GlyphRendererView} from "./glyph_renderer"
import {LayoutProvider} from "../graphs/layout_provider"
import {GraphHitTestPolicy, NodesOnly} from "../graphs/graph_hit_test_policy"
import * as p from "core/properties"
import {build_views} from "core/build_views"
import {SelectionManager} from "core/selection_manager"

export class GraphRendererView extends DataRendererView {
  model: GraphRenderer

  node_view: GlyphRendererView
  edge_view: GlyphRendererView

  protected _renderer_views: {[key: string]: GlyphRendererView}

  initialize(): void {
    super.initialize()

    this._renderer_views = {}

    ;[this.node_view, this.edge_view] = build_views(this._renderer_views, [
      this.model.node_renderer,
      this.model.edge_renderer,
    ], {parent: this.parent}) as [GlyphRendererView, GlyphRendererView]

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

    const {x_range, y_range} = this.plot_view.frame
    this.connect(x_range.change, () => this.set_data())
    this.connect(y_range.change, () => this.set_data())
  }

  set_data(request_render: boolean = true): void {
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
