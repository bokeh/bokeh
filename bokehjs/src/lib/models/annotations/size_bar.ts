import {BaseBar, BaseBarView} from "./base_bar"
import type {RadialGlyph, RadialGlyphView} from "../glyphs/radial_glyph"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import type {Context2d} from "core/util/canvas"
import type {Range} from "../ranges/range"
import type {Scale} from "../scales"
import {LinearScale} from "../scales"
import {DataRange1d} from "../ranges/data_range1d"
import {LinearAxis} from "../axes/linear_axis"
import type * as p from "core/properties"
import * as uniforms from "core/uniforms"
import {ColumnDataSource} from "../sources/column_data_source"
import type {ViewOf} from "core/build_views"
import type {ElementLike} from "../renderers/composite_renderer"
import {isString} from "core/util/types"
import type {Align, Orientation} from "core/enums"
import {Title} from "../annotations/title"
import {Plot} from "../plots/plot"
import {FixedTicker} from "../tickers/fixed_ticker"
import {max, linspace, repeat} from "core/util/array"

export class SizeBarView extends BaseBarView {
  declare model: SizeBar

  protected _major_range: Range
  protected _major_scale: Scale
  protected _minor_range: Range
  protected _minor_scale: Scale

  protected _size_bar: Plot
  protected _size_bar_view: ViewOf<Plot>

  protected _data_source: ColumnDataSource
  protected _major_axis: LinearAxis
  protected _major_ticker: FixedTicker

  get align(): {h: Align, v: Align} {
    const {location} = this.model
    if (isString(location)) {
      switch (location) {
        case "top_left":      return {v: "start",  h: "start"}
        case "top":
        case "top_center":    return {v: "start",  h: "center"}
        case "top_right":     return {v: "start",  h: "end"}
        case "bottom_left":   return {v: "end",    h: "start"}
        case "bottom":
        case "bottom_center": return {v: "end",    h: "center"}
        case "bottom_right":  return {v: "end",    h: "end"}
        case "left":
        case "center_left":   return {v: "center", h: "start"}
        case "center":
        case "center_center": return {v: "center", h: "center"}
        case "right":
        case "center_right":  return {v: "center", h: "end"}
      }
    } else {
      return {v: "end", h: "start"}
    }
  }

  get orientation(): Orientation {
    const {orientation} = this.model
    const {align} = this
    if (orientation == "auto") {
      if (this.panel != null) {
        return this.panel.is_horizontal ? "horizontal" : "vertical"
      } else {
        if (align.h == "start" || align.h == "end" || (/*align.h == "center" &&*/ align.v == "center")) {
          return "vertical"
        } else {
          return "horizontal"
        }
      }
    } else {
      return orientation
    }
  }

  override initialize(): void {
    super.initialize()

    const {orientation} = this

    this._major_range = new DataRange1d()
    this._major_scale = new LinearScale()

    this._minor_range = new DataRange1d()
    this._minor_scale = new LinearScale()

    const {renderer} = this.model

    const Cls = renderer.glyph.constructor as any // expression not constructible
    const glyph: RadialGlyph = new Cls({
      x: {field: "x"},
      y: {field: "y"},
      radius: {field: "r"},
      line_color: null,
    } as RadialGlyph.Attrs)
    this._data_source = new ColumnDataSource({
      data: {
        x: [],
        y: [],
        r: [],
      },
    })
    const circle_renderer = new GlyphRenderer({data_source: this._data_source, glyph})

    this._major_ticker = new FixedTicker({ticks: []})
    this._major_axis = new LinearAxis({ticker: this._major_ticker, axis_line_color: null})

    const {title} = this.model

    switch (orientation) {
      case "horizontal": {
        this._size_bar = new Plot({
          frame_width: 200,
          frame_height: 50,
          renderers: [circle_renderer],
          below: [this._major_axis],
          x_range: this._major_range,
          y_range: this._minor_range,
          x_scale: this._major_scale,
          y_scale: this._minor_scale,
          toolbar_location: null,
          outline_line_color: null,
          title: new Title({text: title ?? undefined}),
        })
        break
      }
      case "vertical": {
        this._size_bar = new Plot({
          frame_width: 50,
          frame_height: 200,
          renderers: [circle_renderer],
          right: [this._major_axis],
          x_range: this._minor_range,
          y_range: this._major_range,
          x_scale: this._minor_scale,
          y_scale: this._major_scale,
          toolbar_location: null,
          outline_line_color: null,
          title: new Title({text: title ?? undefined}),
        })
        break
      }
    }
  }

  override get computed_elements(): ElementLike[] {
    return [...super.computed_elements, this._size_bar]
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    this._size_bar_view = this._element_views.get(this._size_bar) as ViewOf<Plot>
  }

  override update_layout(): void {
    this.layout = this._size_bar_view.layout
  }

  get glyph_view(): RadialGlyphView {
    const rv = this.plot_view.views.get_one(this.model.renderer)
    return rv.glyph_view as RadialGlyphView
  }

  protected _paint(_ctx: Context2d): void {
    const {glyph_view} = this

    const start = Math.ceil(uniforms.min(glyph_view.radius))
    const end = Math.floor(uniforms.max(glyph_view.radius))

    const ticks = linspace(start, end, 5)
    const v_max = max(ticks)

    this._major_ticker.ticks = ticks

    const x = ticks
    const y = repeat(0, x.length)
    const r = ticks.map((v) => v/v_max)

    switch (this.orientation) {
      case "horizontal": {
        this._data_source.data = {x, y, r}
        break
      }
      case "vertical": {
        this._data_source.data = {x: y, y: x, r}
        break
      }
    }
  }
}

export namespace SizeBar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseBar.Props & {
    renderer: p.Property<GlyphRenderer<RadialGlyph>>
  }
}

export interface SizeBar extends SizeBar.Attrs {}

export class SizeBar extends BaseBar {
  declare properties: SizeBar.Props
  declare __view_type__: SizeBarView

  constructor(attrs?: Partial<SizeBar.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SizeBarView

    this.define<SizeBar.Props>(({Ref}) => ({
      renderer: [ Ref(GlyphRenderer) ],
    }))
  }
}
