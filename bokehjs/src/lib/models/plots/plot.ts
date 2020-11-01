import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {Signal0} from "core/signaling"
import {Location, OutputBackend, Place, ResetPolicy} from "core/enums"
import {concat, remove_by} from "core/util/array"
import {values} from "core/util/object"
import {isArray} from "core/util/types"

import {LayoutDOM} from "../layouts/layout_dom"
import {Axis} from "../axes/axis"
import {Grid} from "../grids/grid"
import {GuideRenderer} from "../renderers/guide_renderer"
import {Annotation} from "../annotations/annotation"
import {Title} from "../annotations/title"
import {LinearScale} from "../scales/linear_scale"
import {Toolbar} from "../tools/toolbar"

import {Range} from "../ranges/range"
import {Scale} from "../scales/scale"
import {Glyph} from "../glyphs/glyph"
import {DataSource} from "../sources/data_source"
import {ColumnDataSource} from "../sources/column_data_source"
import {Renderer} from "../renderers/renderer"
import {DataRenderer} from "../renderers/data_renderer"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import {Tool} from "../tools/tool"
import {DataRange1d} from '../ranges/data_range1d'

import {PlotView} from "./plot_canvas"

export {PlotView}

export namespace Plot {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    toolbar: p.Property<Toolbar>
    toolbar_location: p.Property<Location | null>
    toolbar_sticky: p.Property<boolean>

    plot_width: p.Property<number | null>
    plot_height: p.Property<number | null>

    frame_width: p.Property<number | null>
    frame_height: p.Property<number | null>

    title: p.Property<Title | string | null>
    title_location: p.Property<Location | null>

    above: p.Property<(Annotation | Axis)[]>
    below: p.Property<(Annotation | Axis)[]>
    left: p.Property<(Annotation | Axis)[]>
    right: p.Property<(Annotation | Axis)[]>
    center: p.Property<(Annotation | Grid)[]>

    renderers: p.Property<Renderer[]>

    x_range: p.Property<Range>
    extra_x_ranges: p.Property<{[key: string]: Range}>
    y_range: p.Property<Range>
    extra_y_ranges: p.Property<{[key: string]: Range}>

    x_scale: p.Property<Scale>
    y_scale: p.Property<Scale>

    lod_factor: p.Property<number>
    lod_interval: p.Property<number>
    lod_threshold: p.Property<number>
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
  properties: Plot.Props
  __view_type__: PlotView

  readonly use_map: boolean = false

  reset: Signal0<this>

  constructor(attrs?: Partial<Plot.Attrs>) {
    super(attrs)
  }

  static init_Plot(): void {
    this.prototype.default_view = PlotView

    this.mixins<Plot.Mixins>([
      ["outline_",    mixins.Line],
      ["background_", mixins.Fill],
      ["border_",     mixins.Fill],
    ])

    this.define<Plot.Props>(({Boolean, Number, String, Array, Dict, Or, Ref, Null, Nullable}) => ({
      toolbar:           [ Ref(Toolbar), () => new Toolbar() ],
      toolbar_location:  [ Nullable(Location), "right" ],
      toolbar_sticky:    [ Boolean, true ],

      plot_width:        [ p.Alias("width") ],
      plot_height:       [ p.Alias("height") ],

      frame_width:       [ Nullable(Number), null ],
      frame_height:      [ Nullable(Number), null ],

      title:             [ Or(Ref(Title), String, Null), () => new Title({text: ""}) ],
      title_location:    [ Nullable(Location), "above" ],

      above:             [ Array(Or(Ref(Annotation), Ref(Axis))), [] ],
      below:             [ Array(Or(Ref(Annotation), Ref(Axis))), [] ],
      left:              [ Array(Or(Ref(Annotation), Ref(Axis))), [] ],
      right:             [ Array(Or(Ref(Annotation), Ref(Axis))), [] ],
      center:            [ Array(Or(Ref(Annotation), Ref(Grid))), [] ],

      renderers:         [ Array(Ref(Renderer)), [] ],

      x_range:           [ Ref(Range), () => new DataRange1d() ],
      extra_x_ranges:    [ Dict(Ref(Range)), {} ],
      y_range:           [ Ref(Range), () => new DataRange1d() ],
      extra_y_ranges:    [ Dict(Ref(Range)), {} ],

      x_scale:           [ Ref(Scale), () => new LinearScale() ],
      y_scale:           [ Ref(Scale), () => new LinearScale() ],

      lod_factor:        [ Number, 10 ],
      lod_interval:      [ Number, 300 ],
      lod_threshold:     [ Number, 2000 ],
      lod_timeout:       [ Number, 500 ],

      hidpi:             [ Boolean, true ],
      output_backend:    [ OutputBackend, "canvas" ],

      min_border:        [ Nullable(Number), 5 ],
      min_border_top:    [ Nullable(Number), null ],
      min_border_left:   [ Nullable(Number), null ],
      min_border_bottom: [ Nullable(Number), null ],
      min_border_right:  [ Nullable(Number), null ],

      inner_width:       [ Number ],
      inner_height:      [ Number ],
      outer_width:       [ Number ],
      outer_height:      [ Number ],

      match_aspect:      [ Boolean, false ],
      aspect_scale:      [ Number, 1 ],

      reset_policy:      [ ResetPolicy, "standard" ],
    }))

    this.override<Plot.Props>({
      width: 600,
      height: 600,
      outline_line_color: "#e5e5e5",
      border_fill_color: "#ffffff",
      background_fill_color: "#ffffff",
    })
  }

  protected _doc_attached(): void {
    super._doc_attached()
    this._push_changes([
      [this.properties.inner_height, null, this.inner_height],
      [this.properties.inner_width, null, this.inner_width],
    ])
  }

  initialize(): void {
    super.initialize()

    this.reset = new Signal0(this, "reset")

    for (const xr of values(this.extra_x_ranges).concat(this.x_range)) {
      let plots = xr.plots
      if (isArray(plots)) {
        plots = plots.concat(this)
        xr.setv({plots}, {silent: true})
      }
    }

    for (const yr of values(this.extra_y_ranges).concat(this.y_range)) {
      let plots = yr.plots
      if (isArray(plots)) {
        plots = plots.concat(this)
        yr.setv({plots}, {silent: true})
      }
    }
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
    return this.renderers.filter((r): r is DataRenderer => r instanceof DataRenderer)
  }

  add_renderers(...renderers: Renderer[]): void {
    this.renderers = this.renderers.concat(renderers)
  }

  add_glyph(glyph: Glyph, source: DataSource = new ColumnDataSource(), extra_attrs: any = {}): GlyphRenderer {
    const attrs = {...extra_attrs, data_source: source, glyph}
    const renderer = new GlyphRenderer(attrs)
    this.add_renderers(renderer)
    return renderer
  }

  add_tools(...tools: Tool[]): void {
    this.toolbar.tools = this.toolbar.tools.concat(tools)
  }

  get panels(): (Annotation | Axis | Grid)[] {
    return [...this.side_panels, ...this.center]
  }

  get side_panels(): (Annotation | Axis)[] {
    const {above, below, left, right} = this
    return concat([above, below, left, right])
  }
}
