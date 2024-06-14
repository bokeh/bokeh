import {DataRenderer, DataRendererView} from "./data_renderer"
import type {GlyphRendererView} from "./glyph_renderer"
import {GlyphRenderer} from "./glyph_renderer"
import type {GlyphView} from "../glyphs/glyph"
import {LayoutProvider} from "../graphs/layout_provider"
import {GraphHitTestPolicy, NodesOnly} from "../graphs/graph_hit_test_policy"
import type * as p from "core/properties"
import type {IterViews} from "core/build_views"
import {build_view} from "core/build_views"
import {logger} from "core/logging"
import type {Geometry} from "core/geometry"
import type {HitTestResult} from "core/hittest"
import type {SelectionManager} from "core/selection_manager"
import {XYGlyph} from "../glyphs/xy_glyph"
import {MultiLine} from "../glyphs/multi_line"
import {Patches} from "../glyphs/patches"

export class GraphRendererView extends DataRendererView {
  declare model: GraphRenderer

  edge_view: GlyphRendererView
  node_view: GlyphRendererView

  get glyph_view(): GlyphView {
    return this.node_view.glyph
  }

  override *children(): IterViews {
    yield* super.children()
    yield this.edge_view
    yield this.node_view
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    this.apply_coordinates()
    const {parent} = this
    const {edge_renderer, node_renderer} = this.model
    this.edge_view = await build_view(edge_renderer, {parent})
    this.node_view = await build_view(node_renderer, {parent})
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.layout_provider.change, async () => {
      this.apply_coordinates()
      await this.edge_view.set_data()
      await this.node_view.set_data()
      this.request_paint()
    })
  }

  protected apply_coordinates(): void {
    const {edge_renderer, node_renderer} = this.model

    const edge_coords = this.model.layout_provider.edge_coordinates
    const node_coords = this.model.layout_provider.node_coordinates

    const xs = {expr: edge_coords.x}
    const ys = {expr: edge_coords.y}

    const x = {expr: node_coords.x}
    const y = {expr: node_coords.y}

    const edge_glyphs = [
      edge_renderer.glyph,
      edge_renderer.hover_glyph,
      edge_renderer.muted_glyph,
      edge_renderer.selection_glyph,
      edge_renderer.nonselection_glyph,
    ]

    const node_glyphs = [
      node_renderer.glyph,
      node_renderer.hover_glyph,
      node_renderer.muted_glyph,
      node_renderer.selection_glyph,
      node_renderer.nonselection_glyph,
    ]

    for (const glyph of edge_glyphs) {
      if (glyph == null || glyph == "auto") {
        continue
      }

      if (!(glyph instanceof MultiLine || glyph instanceof Patches)) {
        logger.warn(`${this}.edge_renderer only supports MultiLine and Patches glyphs`)
        continue
      }

      glyph.properties.xs.internal = true
      glyph.properties.ys.internal = true

      glyph.xs = xs
      glyph.ys = ys
    }

    for (const glyph of node_glyphs) {
      if (glyph == null || glyph == "auto") {
        continue
      }

      if (!(glyph instanceof XYGlyph)) {
        logger.warn(`${this}.node_renderer only supports XY glyphs`)
        continue
      }

      glyph.properties.x.internal = true
      glyph.properties.y.internal = true

      glyph.x = x
      glyph.y = y
    }
  }

  override remove(): void {
    this.edge_view.remove()
    this.node_view.remove()
    super.remove()
  }

  protected _paint(): void {
    this.edge_view.paint()
    this.node_view.paint()
  }

  override get has_webgl(): boolean {
    return this.edge_view.has_webgl || this.node_view.has_webgl
  }

  hit_test(geometry: Geometry): HitTestResult {
    return this.model.inspection_policy.hit_test(geometry, this)
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
  declare properties: GraphRenderer.Props
  declare __view_type__: GraphRendererView

  constructor(attrs?: Partial<GraphRenderer.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = GraphRendererView

    this.define<GraphRenderer.Props>(({Ref}) => ({
      layout_provider:   [ Ref(LayoutProvider) ],
      node_renderer:     [ Ref(GlyphRenderer) ],
      edge_renderer:     [ Ref(GlyphRenderer) ],
      selection_policy:  [ Ref(GraphHitTestPolicy), () => new NodesOnly() ],
      inspection_policy: [ Ref(GraphHitTestPolicy), () => new NodesOnly() ],
    }))
  }

  get_selection_manager(): SelectionManager {
    return this.node_renderer.data_source.selection_manager
  }
}
