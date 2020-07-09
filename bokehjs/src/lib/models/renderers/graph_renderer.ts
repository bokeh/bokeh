import {DataRenderer, DataRendererView} from "./data_renderer"
import {GlyphRenderer, GlyphRendererView} from "./glyph_renderer"
import {LayoutProvider} from "../graphs/layout_provider"
import {GraphHitTestPolicy, NodesOnly} from "../graphs/graph_hit_test_policy"
import * as p from "core/properties"
import {build_view} from "core/build_views"
import {SelectionManager} from "core/selection_manager"
import {XYGlyph} from "../glyphs/xy_glyph"
import {MultiLine} from "../glyphs/multi_line"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Arrayable} from "core/types"
import {assert} from "core/util/assert"

export class GraphRendererView extends DataRendererView {
  model: GraphRenderer

  edge_view: GlyphRendererView
  node_view: GlyphRendererView

  async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const graph = this.model

    // TODO: replace this with bi-variate transforms
    let xs_ys: [Arrayable<number>[], Arrayable<number>[]] | null = null
    let x_y: [Arrayable<number>, Arrayable<number>] | null = null

    const xs_expr = {
      v_compute(source: ColumnarDataSource) {
        assert(xs_ys == null)
        const [xs] = xs_ys = graph.layout_provider.get_edge_coordinates(source)
        return xs
      },
    }
    const ys_expr = {
      v_compute(_source: ColumnarDataSource) {
        assert(xs_ys != null)
        const [, ys] = xs_ys
        xs_ys = null
        return ys
      },
    }

    const x_expr = {
      v_compute(source: ColumnarDataSource) {
        assert(x_y == null)
        const [x] = x_y = graph.layout_provider.get_node_coordinates(source)
        return x
      },
    }
    const y_expr = {
      v_compute(_source: ColumnarDataSource) {
        assert(x_y != null)
        const [, y] = x_y
        x_y = null
        return y
      },
    }

    const {edge_renderer, node_renderer} = this.model

    edge_renderer.glyph.xs = {expr: xs_expr}
    edge_renderer.glyph.ys = {expr: ys_expr}

    node_renderer.glyph.x = {expr: x_expr}
    node_renderer.glyph.y = {expr: y_expr}

    const {parent} = this
    this.edge_view = await build_view(edge_renderer, {parent})
    this.node_view = await build_view(node_renderer, {parent})
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.layout_provider.change, () => {
      this.edge_view.set_data(false)
      this.node_view.set_data(false)
      this.request_render()
    })
  }

  remove(): void {
    this.edge_view.remove()
    this.node_view.remove()
    super.remove()
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
    node_renderer: p.Property<GlyphRenderer & {glyph: XYGlyph}>
    edge_renderer: p.Property<GlyphRenderer & {glyph: MultiLine}>
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
      layout_provider:   [ p.Instance                        ],
      node_renderer:     [ p.Instance                        ],
      edge_renderer:     [ p.Instance                        ],
      selection_policy:  [ p.Instance, () => new NodesOnly() ],
      inspection_policy: [ p.Instance, () => new NodesOnly() ],
    })
  }

  get_selection_manager(): SelectionManager {
    return this.node_renderer.data_source.selection_manager
  }
}
