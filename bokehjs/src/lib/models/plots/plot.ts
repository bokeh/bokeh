import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import * as p from "core/properties"
import {Signal0} from "core/signaling"
import type {Place} from "core/enums"
import {Location, OutputBackend, ResetPolicy, WindowAxis} from "core/enums"
import {concat, remove} from "core/util/array"
import {difference} from "core/util/set"
import {isString} from "core/util/types"
import type {LRTB} from "core/util/bbox"
import type {Dict} from "core/types"

import {LayoutDOM} from "../layouts/layout_dom"
import {Axis} from "../axes/axis"
import {Grid} from "../grids/grid"
import type {GuideRenderer} from "../renderers/guide_renderer"
import {Annotation} from "../annotations/annotation"
import {Title} from "../annotations/title"
import type {CoordinateMapping} from "../coordinates/coordinate_mapping"
import {CartesianMapping} from "../coordinates/cartesian_mapping"
import {PolarMapping} from "../coordinates/polar_mapping"
import {glyph_coordinate_error} from "../coordinates/compatibility"
import {LinearScale} from "../scales/linear_scale"
import {Toolbar} from "../tools/toolbar"
import {HTML} from "../dom/html"

import {Range} from "../ranges/range"
import {Scale} from "../scales/scale"
import type {Glyph} from "../glyphs/glyph"
import type {IndexedDataSource} from "../sources/indexed_data_source"
import {ColumnDataSource} from "../sources/column_data_source"
import {Renderer} from "../renderers/renderer"
import {DataRenderer} from "../renderers/data_renderer"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import type {GlyphRendererWithSource} from "../renderers/glyph_renderer"
import type {ToolAliases} from "../tools/tool"
import {Tool} from "../tools/tool"
import {ClickPanTool} from "../tools/actions/click_pan_tool"
import {WheelPanTool} from "../tools/gestures/wheel_pan_tool"
import {BoxZoomTool} from "../tools/gestures/box_zoom_tool"
import {EditTool} from "../tools/edit/edit_tool"
import {RangeTool} from "../tools/gestures/range_tool"
import {PanTool} from "../tools/gestures/pan_tool"
import {WheelZoomTool} from "../tools/gestures/wheel_zoom_tool"
import {ZoomInTool} from "../tools/actions/zoom_in_tool"
import {ZoomOutTool} from "../tools/actions/zoom_out_tool"
import "../tools/aliases"
import {DataRange1d} from "../ranges/data_range1d"
import {StyledElement} from "../ui/styled_element"

import {PlotView} from "./plot_canvas"
export {PlotView}

export namespace Plot {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    toolbar: p.Property<Toolbar>
    toolbar_location: p.Property<Location | null>
    toolbar_sticky: p.Property<boolean>
    toolbar_inner: p.Property<boolean>

    frame_width: p.Property<number | null>
    frame_height: p.Property<number | null>
    frame_align: p.Property<boolean | Partial<LRTB<boolean>>>

    title: p.Property<Title | string | null>
    title_location: p.Property<Location | null>

    above: p.Property<(Annotation | Axis | StyledElement)[]>
    below: p.Property<(Annotation | Axis | StyledElement)[]>
    left: p.Property<(Annotation | Axis | StyledElement)[]>
    right: p.Property<(Annotation | Axis | StyledElement)[]>
    center: p.Property<(Annotation | Grid | StyledElement)[]>

    renderers: p.Property<Renderer[]>

    coordinate_system: p.Property<CartesianMapping | PolarMapping | null>

    x_range: p.Property<Range>
    y_range: p.Property<Range>

    x_scale: p.Property<Scale>
    y_scale: p.Property<Scale>

    extra_x_ranges: p.Property<Dict<Range>>
    extra_y_ranges: p.Property<Dict<Range>>

    extra_x_scales: p.Property<Dict<Scale>>
    extra_y_scales: p.Property<Dict<Scale>>

    window_axis: p.Property<WindowAxis>

    lod_factor: p.Property<number>
    lod_interval: p.Property<number>
    lod_threshold: p.Property<number | null>
    lod_timeout: p.Property<number>

    output_backend: p.Property<OutputBackend>

    min_border: p.Property<number | null>
    min_border_top: p.Property<number | null>
    min_border_left: p.Property<number | null>
    min_border_bottom: p.Property<number | null>
    min_border_right: p.Property<number | null>

    inner_width: p.Property<number>
    inner_height: p.Property<number>
    outer_width: p.Property<number>
    outer_height: p.Property<number>

    match_aspect: p.Property<boolean>
    aspect_scale: p.Property<number>

    reset_policy: p.Property<ResetPolicy>

    hold_render: p.Property<boolean>

    attribution: p.Property<(string | HTML)[]>
  } & Mixins

  export type Mixins =
    mixins.OutlineLine    &
    mixins.BackgroundFill &
    mixins.BackgroundHatch &
    mixins.BorderLine &
    mixins.BorderFill &
    mixins.BorderHatch

  export type Visuals = visuals.Visuals & {
    outline_line: visuals.Line
    background_fill: visuals.Fill
    background_hatch: visuals.Hatch
    border_line: visuals.Line
    border_fill: visuals.Fill
    border_hatch: visuals.Hatch
  }
}

export interface Plot extends Plot.Attrs {}

export class Plot extends LayoutDOM {
  declare properties: Plot.Props
  declare __view_type__: PlotView

  override initialize(): void {
    super.initialize()
    this._sync_coordinate_system()
  }

  private _sync_coordinate_system(): void {
    const mapping = this.coordinate_system
    if (mapping == null) {
      return
    }
    if (mapping instanceof PolarMapping && (!(this.x_scale instanceof LinearScale) || !(this.y_scale instanceof LinearScale))) {
      throw new Error("PolarMapping currently supports linear radial scaling only")
    }
    const [x_range, y_range] = mapping.ranges
    this.setv({x_range, y_range, ...(mapping instanceof CartesianMapping ? {x_scale: mapping.x_scale, y_scale: mapping.y_scale} : {})})
  }

  override connect_signals(): void {
    super.connect_signals()
    this.on_change([this.properties.x_range, this.properties.y_range, this.properties.x_scale, this.properties.y_scale], () => this._sync_coordinate_system())
    this.on_transitive_change(this.properties.coordinate_system, () => this._sync_coordinate_system())
  }

  readonly use_map: boolean = false

  readonly reset = new Signal0(this, "reset")

  static {
    this.prototype.default_view = PlotView

    this.mixins<Plot.Mixins>([
      ["outline_",    mixins.Line],
      ["background_", mixins.Fill],
      ["background_", mixins.Hatch],
      ["border_",     mixins.Line],
      ["border_",     mixins.Fill],
      ["border_",     mixins.Hatch],
    ])

    this.define<Plot.Props>(({Bool, Float, Str, List, Dict, Or, Ref, Null, Nullable, Struct, Opt}) => ({
      coordinate_system: [ Nullable(Or(Ref(CartesianMapping), Ref(PolarMapping))), null ],

      toolbar:           [ Ref(Toolbar), () => Toolbar.create() ],
      toolbar_location:  [ Nullable(Location), "right" ],
      toolbar_sticky:    [ Bool, true ],
      toolbar_inner:     [ Bool, false ],

      frame_width:       [ Nullable(Float), null ],
      frame_height:      [ Nullable(Float), null ],
      frame_align:       [ Or(Bool, Struct({left: Opt(Bool), right: Opt(Bool), top: Opt(Bool), bottom: Opt(Bool)})), true ],

      // revise this when https://github.com/microsoft/TypeScript/pull/42425 is merged
      title:             [ Or(Ref(Title), Str, Null), "", {
        convert: (title) => isString(title) ? Title.create({text: title}) : title,
      }],
      title_location:    [ Nullable(Location), "above" ],

      above:             [ List(Or(Ref(Annotation), Ref(Axis), Ref(StyledElement))), [] ],
      below:             [ List(Or(Ref(Annotation), Ref(Axis), Ref(StyledElement))), [] ],
      left:              [ List(Or(Ref(Annotation), Ref(Axis), Ref(StyledElement))), [] ],
      right:             [ List(Or(Ref(Annotation), Ref(Axis), Ref(StyledElement))), [] ],
      center:            [ List(Or(Ref(Annotation), Ref(Grid), Ref(StyledElement))), [] ],

      renderers:         [ List(Ref(Renderer)), [] ],

      x_range:           [ Ref(Range), () => DataRange1d.create() ],
      y_range:           [ Ref(Range), () => DataRange1d.create() ],

      x_scale:           [ Ref(Scale), () => LinearScale.create() ],
      y_scale:           [ Ref(Scale), () => LinearScale.create() ],

      extra_x_ranges:    [ Dict(Ref(Range)), {} ],
      extra_y_ranges:    [ Dict(Ref(Range)), {} ],

      extra_x_scales:    [ Dict(Ref(Scale)), {} ],
      extra_y_scales:    [ Dict(Ref(Scale)), {} ],

      window_axis:       [ WindowAxis, "none" ],

      lod_factor:        [ Float, 10 ],
      lod_interval:      [ Float, 300 ],
      lod_threshold:     [ Nullable(Float), 2000 ],
      lod_timeout:       [ Float, 500 ],

      output_backend:    [ OutputBackend, "canvas" ],

      min_border:        [ Nullable(Float), 5 ],
      min_border_top:    [ Nullable(Float), null ],
      min_border_left:   [ Nullable(Float), null ],
      min_border_bottom: [ Nullable(Float), null ],
      min_border_right:  [ Nullable(Float), null ],

      inner_width:       [ Float, p.unset, {readonly: true} ],
      inner_height:      [ Float, p.unset, {readonly: true} ],
      outer_width:       [ Float, p.unset, {readonly: true} ],
      outer_height:      [ Float, p.unset, {readonly: true} ],

      match_aspect:      [ Bool, false ],
      aspect_scale:      [ Float, 1 ],

      reset_policy:      [ ResetPolicy, "standard" ],

      hold_render:       [ Bool, false ],

      attribution:       [ List(Or(Str, Ref(HTML))), [] ],
    }))

    this.override<Plot.Props>({
      width: 600,
      height: 600,
      outline_line_color: "#e5e5e5",
      border_line_color: null,
      border_fill_color: "#ffffff",
      background_fill_color: "#ffffff",
      context_menu: "auto",
    })
  }

  add_layout(renderer: Annotation | GuideRenderer | StyledElement, side: Place = "center"): void {
    this.remove_layout(renderer)

    const renderers = this.properties[side].get_value()
    this.setv({[side]: [...renderers, renderer]})
  }

  remove_layout(renderer: Annotation | GuideRenderer | StyledElement): void {
    remove(this.left, renderer)
    remove(this.right, renderer)
    remove(this.above, renderer)
    remove(this.below, renderer)
    remove(this.center, renderer)
  }

  get data_renderers(): DataRenderer[] {
    return this.renderers.filter((r) => r instanceof DataRenderer)
  }

  add_renderers(...renderers: Renderer[]): void {
    this.renderers = [...this.renderers, ...renderers]
  }

  polar_coordinate_error(coordinates: CoordinateMapping | null): string | null {
    if (coordinates instanceof PolarMapping && coordinates != this.coordinate_system) {
      return "PolarMapping renderer coordinates require a matching polar parent plot"
    }
    if (this.coordinate_system instanceof PolarMapping && coordinates != null && coordinates != this.coordinate_system) {
      return "Subplots and renderer-level coordinate systems require a Cartesian parent plot"
    }
    return null
  }

  polar_glyph_error(glyph: Glyph, coordinates: CoordinateMapping | null = null): string | null {
    const problem = this.polar_coordinate_error(coordinates)
    if (problem != null) {
      return problem
    }
    return glyph_coordinate_error(glyph, coordinates ?? this.coordinate_system)
  }

  add_glyph<BaseGlyph extends Glyph>(glyph: BaseGlyph, source?: ColumnDataSource,
    attrs?: Partial<GlyphRenderer.Attrs<BaseGlyph>>): GlyphRendererWithSource<BaseGlyph, ColumnDataSource>
  add_glyph<BaseGlyph extends Glyph, Source extends IndexedDataSource>(glyph: BaseGlyph, source: Source,
    attrs?: Partial<GlyphRenderer.Attrs<BaseGlyph>>): GlyphRendererWithSource<BaseGlyph, Source>
  add_glyph<BaseGlyph extends Glyph>(glyph: BaseGlyph, source: IndexedDataSource = ColumnDataSource.create(),
      attrs: Partial<GlyphRenderer.Attrs<BaseGlyph>> = {}): GlyphRenderer<BaseGlyph> {
    const problem = this.polar_glyph_error(glyph, attrs.coordinates ?? null)
    if (problem != null) {
      throw new Error(problem)
    }
    const renderer = GlyphRenderer.create({...attrs, data_source: source, glyph})
    this.add_renderers(renderer)
    return renderer
  }

  polar_tool_error(tool: Tool): string | null {
    if (!(this.coordinate_system instanceof PolarMapping)) {
      return null
    }
    if (tool instanceof BoxZoomTool || tool instanceof ZoomInTool || tool instanceof ZoomOutTool || tool instanceof EditTool || tool instanceof RangeTool || tool instanceof WheelPanTool || tool instanceof ClickPanTool) {
      return `${tool.type} is not supported by PolarMapping`
    }
    if ((tool instanceof PanTool || tool instanceof WheelZoomTool) && tool.dimensions != "both") {
      return "PolarMapping requires pan and wheel zoom tools with dimensions='both'"
    }
    return null
  }

  add_tools(...tools: (Tool | keyof ToolAliases)[]): void {
    const computed_tools = tools.map((tool) => tool instanceof Tool ? tool : Tool.from_string(tool))
    for (const tool of computed_tools) {
      const problem = this.polar_tool_error(tool)
      if (problem != null) {
        throw new Error(problem)
      }
    }
    this.toolbar.tools = [...this.toolbar.tools, ...computed_tools]
  }

  remove_tools(...tools: Tool[]): void {
    this.toolbar.tools = [...difference(new Set(this.toolbar.tools), new Set(tools))]
  }

  get panels(): (Annotation | Axis | Grid | StyledElement)[] {
    return [...this.side_panels, ...this.center]
  }

  get side_panels(): (Annotation | Axis | StyledElement)[] {
    const {above, below, left, right} = this
    return concat([above, below, left, right])
  }
}
