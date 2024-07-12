import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import * as p from "core/properties"
import {Signal0} from "core/signaling"
import type {Place} from "core/enums"
import {Location, OutputBackend, ResetPolicy} from "core/enums"
import {concat, remove_by} from "core/util/array"
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
import {LinearScale} from "../scales/linear_scale"
import {Toolbar} from "../tools/toolbar"
import {HTML} from "../dom/html"

import {Range} from "../ranges/range"
import {Scale} from "../scales/scale"
import type {Glyph} from "../glyphs/glyph"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import {ColumnDataSource} from "../sources/column_data_source"
import {Renderer} from "../renderers/renderer"
import {DataRenderer} from "../renderers/data_renderer"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import type {ToolAliases} from "../tools/tool"
import {Tool} from "../tools/tool"
import {DataRange1d} from "../ranges/data_range1d"

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

    above: p.Property<(Annotation | Axis)[]>
    below: p.Property<(Annotation | Axis)[]>
    left: p.Property<(Annotation | Axis)[]>
    right: p.Property<(Annotation | Axis)[]>
    center: p.Property<(Annotation | Grid)[]>

    renderers: p.Property<Renderer[]>

    x_range: p.Property<Range>
    y_range: p.Property<Range>

    x_scale: p.Property<Scale>
    y_scale: p.Property<Scale>

    extra_x_ranges: p.Property<Dict<Range>>
    extra_y_ranges: p.Property<Dict<Range>>

    extra_x_scales: p.Property<Dict<Scale>>
    extra_y_scales: p.Property<Dict<Scale>>

    lod_factor: p.Property<number>
    lod_interval: p.Property<number>
    lod_threshold: p.Property<number | null>
    lod_timeout: p.Property<number>

    hidpi: p.Property<boolean>
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
    mixins.BorderFill

  export type Visuals = visuals.Visuals & {
    outline_line: visuals.Line
    background_fill: visuals.Fill
    border_fill: visuals.Fill
  }
}

export interface Plot extends Plot.Attrs {}

export class Plot extends LayoutDOM {
  declare properties: Plot.Props
  declare __view_type__: PlotView

  readonly use_map: boolean = false

  readonly reset = new Signal0(this, "reset")

  constructor(attrs?: Partial<Plot.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PlotView

    this.mixins<Plot.Mixins>([
      ["outline_",    mixins.Line],
      ["background_", mixins.Fill],
      ["border_",     mixins.Fill],
    ])

    this.define<Plot.Props>(({Bool, Float, Str, List, Dict, Or, Ref, Null, Nullable, Struct, Opt}) => ({
      toolbar:           [ Ref(Toolbar), () => new Toolbar() ],
      toolbar_location:  [ Nullable(Location), "right" ],
      toolbar_sticky:    [ Bool, true ],
      toolbar_inner:     [ Bool, false ],

      frame_width:       [ Nullable(Float), null ],
      frame_height:      [ Nullable(Float), null ],
      frame_align:       [ Or(Bool, Struct({left: Opt(Bool), right: Opt(Bool), top: Opt(Bool), bottom: Opt(Bool)})), true ],

      // revise this when https://github.com/microsoft/TypeScript/pull/42425 is merged
      title:             [ Or(Ref(Title), Str, Null), "", {
        convert: (title) => isString(title) ? new Title({text: title}) : title,
      }],
      title_location:    [ Nullable(Location), "above" ],

      above:             [ List(Or(Ref(Annotation), Ref(Axis))), [] ],
      below:             [ List(Or(Ref(Annotation), Ref(Axis))), [] ],
      left:              [ List(Or(Ref(Annotation), Ref(Axis))), [] ],
      right:             [ List(Or(Ref(Annotation), Ref(Axis))), [] ],
      center:            [ List(Or(Ref(Annotation), Ref(Grid))), [] ],

      renderers:         [ List(Ref(Renderer)), [] ],

      x_range:           [ Ref(Range), () => new DataRange1d() ],
      y_range:           [ Ref(Range), () => new DataRange1d() ],

      x_scale:           [ Ref(Scale), () => new LinearScale() ],
      y_scale:           [ Ref(Scale), () => new LinearScale() ],

      extra_x_ranges:    [ Dict(Ref(Range)), {} ],
      extra_y_ranges:    [ Dict(Ref(Range)), {} ],

      extra_x_scales:    [ Dict(Ref(Scale)), {} ],
      extra_y_scales:    [ Dict(Ref(Scale)), {} ],

      lod_factor:        [ Float, 10 ],
      lod_interval:      [ Float, 300 ],
      lod_threshold:     [ Nullable(Float), 2000 ],
      lod_timeout:       [ Float, 500 ],

      hidpi:             [ Bool, true ],
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
      border_fill_color: "#ffffff",
      background_fill_color: "#ffffff",
    })
  }

  add_layout(renderer: Annotation | GuideRenderer, side: Place = "center"): void {
    const renderers = this.properties[side].get_value()
    this.setv({[side]: [...renderers, renderer]})
  }

  remove_layout(renderer: Annotation | GuideRenderer): void {

    const del = (items: (Annotation | GuideRenderer)[]): void => {
      remove_by(items, (item) => item == renderer)
    }

    del(this.left)
    del(this.right)
    del(this.above)
    del(this.below)
    del(this.center)
  }

  get data_renderers(): DataRenderer[] {
    return this.renderers.filter((r) => r instanceof DataRenderer)
  }

  add_renderers(...renderers: Renderer[]): void {
    this.renderers = [...this.renderers, ...renderers]
  }

  add_glyph<BaseGlyph extends Glyph>(glyph: BaseGlyph, source: ColumnarDataSource = new ColumnDataSource(),
      attrs: Partial<GlyphRenderer.Attrs<BaseGlyph>> = {}): GlyphRenderer<BaseGlyph> {
    const renderer = new GlyphRenderer({...attrs, data_source: source, glyph})
    this.add_renderers(renderer)
    return renderer
  }

  add_tools(...tools: (Tool | keyof ToolAliases)[]): void {
    const computed_tools = tools.map((tool) => tool instanceof Tool ? tool : Tool.from_string(tool))
    this.toolbar.tools = [...this.toolbar.tools, ...computed_tools]
  }

  remove_tools(...tools: Tool[]): void {
    this.toolbar.tools = [...difference(new Set(this.toolbar.tools), new Set(tools))]
  }

  get panels(): (Annotation | Axis | Grid)[] {
    return [...this.side_panels, ...this.center]
  }

  get side_panels(): (Annotation | Axis)[] {
    const {above, below, left, right} = this
    return concat([above, below, left, right])
  }
}
