import {DataRenderer, DataRendererView} from "./data_renderer"
import type {GlyphRendererView} from "./glyph_renderer"
import {GlyphRenderer} from "./glyph_renderer"
import type {GlyphRendererWithSource} from "./glyph_renderer"
import {GlyphView} from "../glyphs/glyph"
import {EdgePathProvider} from "../graphs/edge_path_provider"
import {LayoutProvider} from "../graphs/layout_provider"
import {StraightEdgePathProvider} from "../graphs/straight_edge_path_provider"
import {GraphSelectionPolicy, GraphSelectionTarget} from "../selections/interaction_policy"
import type * as p from "core/properties"
import type {ChildView} from "core/build_views"
import {build_view} from "core/build_views"
import {logger} from "core/logging"
import type {Geometry} from "core/geometry"
import type {HitTestResult} from "core/hittest"
import type {Context2d} from "core/util/canvas"
import type {SelectionManager} from "core/selection_manager"
import {XYGlyph} from "../glyphs/xy_glyph"
import {Scatter} from "../glyphs/scatter"
import {MultiLine} from "../glyphs/multi_line"
import {Segment} from "../glyphs/segment"
import {Bezier} from "../glyphs/bezier"
import {Patches} from "../glyphs/patches"
import {ColumnDataSource} from "../sources/column_data_source"
import {GraphDataSource} from "../sources/graph_data_source"
import type {IndexedDataSource} from "../sources/indexed_data_source"

type EdgeGlyph = MultiLine | Patches | Segment | Bezier
type NodeRenderer = GlyphRendererWithSource<XYGlyph, IndexedDataSource>
type EdgeRenderer = GlyphRendererWithSource<EdgeGlyph, IndexedDataSource>

function default_node_renderer(source: GraphDataSource["nodes"]): NodeRenderer {
  return GlyphRenderer.create({glyph: Scatter.create(), data_source: source}) as NodeRenderer
}

function default_edge_renderer(source: GraphDataSource["edges"]): EdgeRenderer {
  return GlyphRenderer.create({glyph: MultiLine.create(), data_source: source}) as EdgeRenderer
}

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
    this.on_transitive_change(this.model.properties.layout_provider, async () => {
      this.model.layout_provider.invalidate(this.model.data_source)
      this.apply_coordinates()
      await this.edge_view.set_data()
      await this.node_view.set_data()
      this.request_paint()
    })
    this.on_transitive_change(this.model.properties.edge_path_provider, async () => {
      this.apply_coordinates()
      await this.edge_view.set_data()
      this.request_paint()
    })
    this.connect(this.model.data_source.data_changed, async () => {
      this.model.layout_provider.invalidate(this.model.data_source)
      await this.edge_view.set_data()
      await this.node_view.set_data()
      this.request_paint()
    })
  }

  protected apply_coordinates(): void {
    const {edge_renderer, node_renderer} = this.model

    const {data_source, layout_provider, edge_path_provider} = this.model
    const edge_coords = edge_path_provider.edge_coordinates(data_source, layout_provider)
    const node_coords = layout_provider.node_coordinates(data_source)

    const start = edge_path_provider.edge_point_coordinates(data_source, layout_provider, "start")
    const end = edge_path_provider.edge_point_coordinates(data_source, layout_provider, "end")
    const control0 = edge_path_provider.edge_point_coordinates(data_source, layout_provider, "control0")
    const control1 = edge_path_provider.edge_point_coordinates(data_source, layout_provider, "control1")
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
    const renderer = this.model.inspection_target == "nodes" ? this.node_view : this.edge_view
    return renderer.hit_test(geometry)
  }
}

export namespace GraphRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataRenderer.Props & {
    data_source: p.Property<GraphDataSource>
    layout_provider: p.Property<LayoutProvider>
    edge_path_provider: p.Property<EdgePathProvider>
    node_renderer: p.Property<NodeRenderer>
    edge_renderer: p.Property<EdgeRenderer>
    selection_target: p.Property<GraphSelectionTarget>
    inspection_target: p.Property<GraphSelectionTarget>
    inspection_policy: p.Property<GraphSelectionPolicy>
  }
}

export interface GraphRenderer extends GraphRenderer.Attrs {}

export class GraphRenderer extends DataRenderer {
  declare properties: GraphRenderer.Props
  declare __view_type__: GraphRendererView

  protected constructor(attrs: Partial<GraphRenderer.Attrs> = {}) {
    const data_source = attrs.data_source ?? GraphDataSource.create({
      nodes: attrs.node_renderer?.data_source ?? ColumnDataSource.create({data: {index: []}}),
      edges: attrs.edge_renderer?.data_source ?? ColumnDataSource.create({data: {start: [], end: []}}),
    })
    const node_renderer = attrs.node_renderer ?? default_node_renderer(data_source.nodes)
    const edge_renderer = attrs.edge_renderer ?? default_edge_renderer(data_source.edges)

    if (node_renderer.data_source != data_source.nodes) {
      throw new Error("GraphRenderer node_renderer and data_source must use the same node source")
    }
    if (edge_renderer.data_source != data_source.edges) {
      throw new Error("GraphRenderer edge_renderer and data_source must use the same edge source")
    }

    const normalized_attrs = {...attrs, data_source, node_renderer, edge_renderer}
    super(normalized_attrs)
  }

  static {
    this.prototype.default_view = GraphRendererView

    this.define<GraphRenderer.Props, GraphRenderer>(({Ref}) => ({
      data_source:       [ Ref(GraphDataSource), () => GraphDataSource.create(), {readonly: true} ],
      layout_provider:   [ Ref(LayoutProvider) ],
      edge_path_provider: [ Ref(EdgePathProvider), () => StraightEdgePathProvider.create() ],
      node_renderer:     [ Ref(GlyphRenderer<XYGlyph>), (self) => default_node_renderer(self.data_source.nodes), {readonly: true} ],
      edge_renderer:     [ Ref(GlyphRenderer<EdgeGlyph>), (self) => default_edge_renderer(self.data_source.edges), {readonly: true} ],
      selection_target:  [ GraphSelectionTarget, "nodes" ],
      inspection_target: [ GraphSelectionTarget, "nodes" ],
      inspection_policy: [ Ref(GraphSelectionPolicy), () => GraphSelectionPolicy.create() ],
    }))
  }

  get_selection_manager(): SelectionManager {
    return this.data_source.selection_manager
  }
}
