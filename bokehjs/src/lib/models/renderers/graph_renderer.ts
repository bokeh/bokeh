import {DataRenderer, DataRendererView} from "./data_renderer"
import type {GlyphRendererView} from "./glyph_renderer"
import {GlyphRenderer} from "./glyph_renderer"
import {GlyphView} from "../glyphs/glyph"
import {LayoutProvider} from "../graphs/layout_provider"
import {GraphHitTestPolicy, NodesOnly} from "../graphs/graph_hit_test_policy"
import type * as p from "core/properties"
import type {ChildView} from "core/build_views"
import {build_view} from "core/build_views"
import {logger} from "core/logging"
import type {Geometry} from "core/geometry"
import type {HitTestResult} from "core/hittest"
import type {Context2d} from "core/util/canvas"
import type {SelectionManager} from "core/selection_manager"
import {XYGlyph} from "../glyphs/xy_glyph"
import {MultiLine} from "../glyphs/multi_line"
import {Segment} from "../glyphs/segment"
import {Bezier} from "../glyphs/bezier"
import {Patches} from "../glyphs/patches"

type EdgeGlyph = MultiLine | Patches | Segment | Bezier

export class GraphRendererView extends DataRendererView {
  declare model: GraphRenderer

  edge_view: GlyphRendererView
  node_view: GlyphRendererView

  get glyph_view(): GlyphView {
    return this.node_view.glyph
  }

  override _children_views(): ChildView[] {
    return [...super._children_views(), this.edge_view, this.node_view]
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    this.apply_coordinates()
    const {edge_renderer, node_renderer} = this.model
    this.edge_view = await build_view(edge_renderer, {parent: this})
    this.node_view = await build_view(node_renderer, {parent: this})
  }

  override connect_signals(): void {
    super.connect_signals()

    this.connect(this.model.layout_provider.change, () => {
      this.apply_coordinates()
      this.edge_view.update_data()
      this.node_view.update_data()
    })
  }

  protected apply_coordinates(): void {
    const {edge_renderer, node_renderer} = this.model

    const edge_coords = this.model.layout_provider.edge_coordinates
    const node_coords = this.model.layout_provider.node_coordinates

    const start = this.model.layout_provider.edge_point_coordinates("start")
    const end = this.model.layout_provider.edge_point_coordinates("end")
    const control0 = this.model.layout_provider.edge_point_coordinates("control0")
    const control1 = this.model.layout_provider.edge_point_coordinates("control1")
    const xs = {expr: edge_coords.x}
    const ys = {expr: edge_coords.y}

    const x = {expr: node_coords.x}
    const y = {expr: node_coords.y}

    // Include generated visual-state glyphs, whose expressions otherwise keep the old layout cached.
    const state_glyphs = (view?: GlyphRendererView) => view?._children_views()
      .filter((child): child is GlyphView => child instanceof GlyphView).map(child => child.model) ?? []

    const edge_glyphs = [
      edge_renderer.glyph,
      edge_renderer.hover_glyph,
      edge_renderer.muted_glyph,
      edge_renderer.selection_glyph,
      edge_renderer.nonselection_glyph,
      ...state_glyphs(this.edge_view),
    ]

    const node_glyphs = [
      node_renderer.glyph,
      node_renderer.hover_glyph,
      node_renderer.muted_glyph,
      node_renderer.selection_glyph,
      node_renderer.nonselection_glyph,
      ...state_glyphs(this.node_view),
    ]

    for (const glyph of new Set(edge_glyphs)) {
      if (glyph == null || glyph == "auto") {
        continue
      }

      const set = (attr: string, value: unknown) => {
        glyph.property(attr).internal = true
        glyph.setv({[attr]: value})
      }
      if (glyph instanceof MultiLine || glyph instanceof Patches) {
        set("xs", xs)
        set("ys", ys)
      } else if (glyph instanceof Segment || glyph instanceof Bezier) {
        set("x0", {expr: start.x})
        set("y0", {expr: start.y})
        set("x1", {expr: end.x})
        set("y1", {expr: end.y})
        if (glyph instanceof Bezier) {
          set("cx0", {expr: control0.x})
          set("cy0", {expr: control0.y})
          set("cx1", {expr: control1.x})
          set("cy1", {expr: control1.y})
        }
      } else {
        logger.warn(`${this}.edge_renderer only supports MultiLine, Patches, Segment, or Bezier glyphs`)
      }
    }

    for (const glyph of new Set(node_glyphs)) {
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

  protected _paint(ctx: Context2d): void {
    this.edge_view.paint(ctx)
    this.node_view.paint(ctx)
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
    node_renderer: p.Property<GlyphRenderer<XYGlyph>>
    edge_renderer: p.Property<GlyphRenderer<EdgeGlyph>>
    selection_policy: p.Property<GraphHitTestPolicy>
    inspection_policy: p.Property<GraphHitTestPolicy>
  }
}

export interface GraphRenderer extends GraphRenderer.Attrs {}

export class GraphRenderer extends DataRenderer {
  declare properties: GraphRenderer.Props
  declare __view_type__: GraphRendererView

  static {
    this.prototype.default_view = GraphRendererView

    this.define<GraphRenderer.Props>(({Ref}) => ({
      layout_provider:   [ Ref(LayoutProvider) ],
      node_renderer:     [ Ref(GlyphRenderer<XYGlyph>) ],
      edge_renderer:     [ Ref(GlyphRenderer<EdgeGlyph>) ],
      selection_policy:  [ Ref(GraphHitTestPolicy), () => NodesOnly.create() ],
      inspection_policy: [ Ref(GraphHitTestPolicy), () => NodesOnly.create() ],
    }))
  }

  get_selection_manager(): SelectionManager {
    return this.node_renderer.data_source.selection_manager
  }
}
