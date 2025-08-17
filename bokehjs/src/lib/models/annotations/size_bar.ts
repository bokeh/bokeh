import {BaseBar, BaseBarView} from "./base_bar"
import type {RadialGlyphView} from "../glyphs/radial_glyph"
import {RadialGlyph} from "../glyphs/radial_glyph"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import type {Context2d} from "core/util/canvas"
import type {Range} from "../ranges/range"
import type {Scale} from "../scales"
import {LinearScale} from "../scales"
import {Range1d} from "../ranges/range1d"
import {LinearAxis} from "../axes/linear_axis"
import type * as p from "core/properties"
import type * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import * as uniforms from "core/uniforms"
import {ColumnDataSource} from "../sources/column_data_source"
import type {ViewOf} from "core/build_views"
import type {ElementLike} from "../renderers/composite_renderer"
import {isString} from "core/util/types"
import type {Align, Orientation} from "core/enums"
import {Title} from "../annotations/title"
import {Plot, PlotView} from "../plots/plot"
import type {TickFormatter} from "../formatters/tick_formatter"
import {BasicTickFormatter} from "../formatters/basic_tick_formatter"
import type {Ticker} from "../tickers/ticker"
import {AdaptiveTicker} from "../tickers/adaptive_ticker"
import {FixedTicker} from "../tickers/fixed_ticker"
import {repeat, elementwise} from "core/util/array"
import {logger} from "core/logging"
import {Circle} from "../glyphs/circle"
import {BBox} from "core/util/bbox"
import {BorderLayout} from "core/layout/border"

class InternalBorderLayout extends BorderLayout {

  override set_geometry(viewport: BBox): void {
    const {outer, inner} = this._compute(viewport)
    super.set_geometry(outer, inner)
  }
}

class InternalPlotView extends PlotView {
  declare model: InternalPlot

  override initialize(): void {
    super.initialize()
    this._range_manager.warn_initial_ranges = false
  }

  protected override _make_layout(): BorderLayout {
    return new InternalBorderLayout()
  }
}

namespace InternalPlot {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Plot.Props
}
interface InternalPlot extends InternalPlot.Attrs {}

class InternalPlot extends Plot {
  declare properties: InternalPlot.Props
  declare __view_type__: InternalPlotView

  constructor(attrs?: Partial<InternalPlot.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = InternalPlotView
  }
}

export class SizeBarView extends BaseBarView {
  declare model: SizeBar
  declare visuals: SizeBar.Visuals
  declare layout: BorderLayout

  protected _major_range: Range
  protected _major_scale: Scale
  protected _minor_range: Range
  protected _minor_scale: Scale

  protected _size_bar: Plot
  protected _size_bar_view: ViewOf<Plot>

  protected _data_source: ColumnDataSource
  protected _major_axis: LinearAxis
  protected _major_ticker: Ticker
  protected _major_formatter: TickFormatter

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

    this._major_range = new Range1d()
    this._major_scale = new LinearScale()

    this._minor_range = new Range1d()
    this._minor_scale = new LinearScale()

    const renderer = this.renderer ?? new GlyphRenderer({glyph: new Circle()})

    const Cls = renderer.glyph.constructor as any // expression not constructible
    const glyph: RadialGlyph = new Cls({
      x: {field: "x"},
      y: {field: "y"},
      radius: {field: "s", units: "screen"},
      ...mixins.attrs_of(this.model, "glyph_", mixins.LineVector),
      ...mixins.attrs_of(this.model, "glyph_", mixins.FillVector),
      ...mixins.attrs_of(this.model, "glyph_", mixins.HatchVector),
    } as RadialGlyph.Attrs)
    this._data_source = new ColumnDataSource({
      data: {
        x: [],
        y: [],
        s: [],
      },
    })
    const circle_renderer = new GlyphRenderer({data_source: this._data_source, glyph})

    const {ticker, formatter} = this.model
    this._major_ticker = ticker != "auto" ? ticker : new FixedTicker({ticks: []})
    this._major_formatter = formatter != "auto" ? formatter : new BasicTickFormatter()
    this._major_axis = new LinearAxis({
      ticker: this._major_ticker,
      formatter: this._major_formatter,
      axis_line_color: null,
      major_label_standoff: this.model.label_standoff,
      major_tick_in: this.model.major_tick_in,
      major_tick_out: this.model.major_tick_out,
      minor_tick_in: this.model.minor_tick_in,
      minor_tick_out: this.model.minor_tick_out,
      major_label_overrides: this.model.major_label_overrides,
      major_label_policy: this.model.major_label_policy,
      ...mixins.attrs_of(this.model, "major_label_", mixins.Text, true),
      ...mixins.attrs_of(this.model, "major_tick_", mixins.Line, true),
      ...mixins.attrs_of(this.model, "minor_tick_", mixins.Line, true),
    })

    const {width, height} = this.model

    const title = new Title({
      text: this.model.title ?? undefined,
      standoff: this.model.title_standoff,
      ...mixins.attrs_of(this.model, "title_", mixins.Text, false),
    })

    const plot_attrs: Partial<InternalPlot.Attrs> = {
      renderers: [circle_renderer],
      toolbar_location: null,
      title,
      ...mixins.attrs_of(this.model, "background_", mixins.Fill, true),
      ...mixins.attrs_of(this.model, "background_", mixins.Hatch, true),
      ...mixins.attrs_of(this.model, "border_", mixins.Line, true),
      ...mixins.attrs_of(this.model, "bar_", mixins.Line, "outline_"),
    }

    switch (orientation) {
      case "horizontal": {
        this._size_bar = new InternalPlot({
          width_policy: width == "max" ? "max" : "fit",
          height_policy: height == "max" ? "max" : "fit",
          frame_width: width == "max" ? undefined : width,
          frame_height: height == "max" ? undefined : height,
          below: [this._major_axis],
          x_range: this._major_range,
          y_range: this._minor_range,
          x_scale: this._major_scale,
          y_scale: this._minor_scale,
          ...plot_attrs,
        })
        break
      }
      case "vertical": {
        this._size_bar = new InternalPlot({
          width_policy: height == "max" ? "max" : "fit",
          height_policy: width == "max" ? "max" : "fit",
          frame_width: height == "max" ? undefined : height,
          frame_height: width == "max" ? undefined : width,
          right: [this._major_axis],
          x_range: this._minor_range,
          y_range: this._major_range,
          x_scale: this._minor_scale,
          y_scale: this._major_scale,
          ...plot_attrs,
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

  private _last_bbox = new BBox()

  override update_layout(): void {
    this.layout = this._size_bar_view.layout
    this.layout.on_resize((outer) => {
      if (!outer.equals(this._last_bbox)) {
        this._last_bbox = outer
        this.parent.request_layout(true)
      }
    })
  }

  get renderer(): GlyphRenderer<RadialGlyph> | null {
    const {renderer} = this.model
    if (renderer == "auto") {
      const renderers = this.plot_view.model.renderers.filter((r): r is GlyphRenderer<RadialGlyph> => {
        return r instanceof GlyphRenderer && r.glyph instanceof RadialGlyph
      })
      switch (renderers.length) {
        case 0: {
          logger.warn("can't find any radial glyph renderers")
          return null
        }
        case 1: {
          return renderers[0]
        }
        default: {
          logger.warn("found multiple radial glyph renderers; choosing the first one")
          return renderers[0]
        }
      }
    } else {
      return renderer
    }
  }

  get glyph_view(): RadialGlyphView | null {
    const {renderer} = this
    if (renderer == null) {
      return null
    } else {
      const rv = this.plot_view.views.get_one(renderer)
      return rv.glyph_view as RadialGlyphView
    }
  }

  protected _paint(_ctx: Context2d): void {
    const {glyph_view} = this
    if (glyph_view == null) {
      return
    }

    const bounds = (() => {
      const {bounds} = this.model
      return bounds == "auto" ? [-Infinity, Infinity] as const : bounds
    })()

    const r_min = Math.max(uniforms.min(glyph_view.radius), bounds[0])
    const r_max = Math.min(uniforms.max(glyph_view.radius), bounds[1])
    const equal = r_max == r_min
    const eps = 0.000001

    const start = equal ? Math.max(r_min - eps, 0) : r_min
    const end = equal ? r_max + eps : r_max

    const n_ticks = equal ? 1 : 5
    const t = new AdaptiveTicker({desired_num_ticks: n_ticks})
    const ticks = t.get_ticks(start == 0 ? end*eps : start, end, new Range1d(), NaN)
    const radii = ticks.major

    if (this.model.ticker == "auto" && this._major_ticker instanceof FixedTicker) {
      this._major_ticker.ticks = radii
    }

    const x = radii
    const y = repeat(0, x.length)

    const s = (() => {
      if (glyph_view.model.properties.radius.units == "data") {
        const sradius_x = () => glyph_view.sdist(glyph_view.renderer.xscale, repeat(0, radii.length), new uniforms.UniformVector(radii))
        const sradius_y = () => glyph_view.sdist(glyph_view.renderer.yscale, repeat(0, radii.length), new uniforms.UniformVector(radii))

        const {radius_dimension} = glyph_view.model
        switch (radius_dimension) {
          case "x": {
            return sradius_x()
          }
          case "y": {
            return sradius_y()
          }
          case "min":
          case "max": {
            return elementwise(sradius_x(), sradius_y(), Math[radius_dimension])
          }
        }
      } else {
        return radii
      }
    })()

    this._major_range.setv({start, end})
    this._minor_range.setv({start: -end, end})

    this._data_source.data = (() => {
      switch (this.orientation) {
        case "horizontal": return {x, y, s}
        case "vertical":   return {x: y, y: x, s}
      }
    })()
  }
}

export namespace SizeBar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseBar.Props & {
    renderer: p.Property<GlyphRenderer<RadialGlyph> | "auto">
    bounds: p.Property<[number, number] | "auto">
  } & Mixins

  export type Mixins =
    mixins.GlyphLineVector &
    mixins.GlyphFillVector &
    mixins.GlyphHatchVector

  export type Visuals = BaseBar.Visuals & {
    glyph_line: visuals.LineVector
    glyph_fill: visuals.FillVector
    glyph_hatch: visuals.HatchVector
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

    this.mixins<SizeBar.Mixins>([
      ["glyph_", mixins.LineVector],
      ["glyph_", mixins.FillVector],
      ["glyph_", mixins.HatchVector],
    ])

    this.override<SizeBar.Props>({
      glyph_line_color: null,
    })

    this.define<SizeBar.Props>(({Ref, Auto, Or, Float, Tuple}) => ({
      renderer: [ Or(Ref(GlyphRenderer), Auto), "auto" ],
      bounds: [ Or(Tuple(Float, Float), Auto), "auto" ],
    }))
  }
}
