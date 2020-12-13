import {Annotation, AnnotationView} from "./annotation"
import {Title} from "./title"
import {Axis} from "../axes/axis"
import {CartesianFrame} from "../canvas/cartesian_frame"
import {Ticker} from "../tickers/ticker"
import {TickFormatter} from "../formatters/tick_formatter"
import {BasicTicker} from "../tickers/basic_ticker"
import {BasicTickFormatter} from "../formatters/basic_tick_formatter"
import {LogTicker} from "../tickers/log_ticker"
import {LogTickFormatter} from "../formatters/log_tick_formatter"
import {BinnedTicker} from "../tickers/binned_ticker"
import {ContinuousColorMapper} from "../mappers/continuous_color_mapper"
import {LinearColorMapper, LogColorMapper, ScanningColorMapper} from "../mappers"
import {LinearScale} from "../scales/linear_scale"
import {LinearInterpolationScale} from "../scales/linear_interpolation_scale"
import {LogScale} from "../scales/log_scale"
import {Range1d} from "../ranges/range1d"

import {LegendLocation, Orientation} from "core/enums"
import * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import * as p from "core/properties"
import {range, reversed} from "core/util/array"
import {Context2d} from "core/util/canvas"
import {Grid, Layoutable} from "core/layout"
import {HStack, VStack} from "core/layout/alignments"
import {BorderLayout} from "core/layout/border"
import {Panel} from "core/layout/side_panel"
import {unreachable} from "core/util/assert"
import {build_view} from "core/build_views"
import {BBox} from "core/util/bbox"

const SHORT_DIM = 25
//const LONG_DIM_MIN_SCALAR = 0.3
//const LONG_DIM_MAX_SCALAR = 0.8

export class ColorBarView extends AnnotationView {
  model: ColorBar
  visuals: ColorBar.Visuals
  layout: Layoutable

  protected image: HTMLCanvasElement

  protected _frame: CartesianFrame

  protected _axis: Axis
  protected _axis_view: Axis["__view_type__"]

  protected _title: Title
  protected _title_view: Title["__view_type__"]

  protected _ticker: Ticker
  protected _formatter: TickFormatter

  protected _outer_layout: Layoutable
  protected _inner_layout: BorderLayout

  initialize(): void {
    super.initialize()

    const {ticker, formatter, color_mapper} = this.model

    this._ticker = ticker != "auto" ? ticker : (() => {
      switch (true) {
        case color_mapper instanceof LogColorMapper:
          return new LogTicker()
        case color_mapper instanceof ScanningColorMapper:
          return new BinnedTicker({mapper: color_mapper as ScanningColorMapper})
        default:
          return new BasicTicker()
      }
    })()

    this._formatter = formatter != "auto" ? formatter : (() => {
      switch (true) {
        case this._ticker instanceof LogTicker:
          return new LogTickFormatter()
        default:
          return new BasicTickFormatter()
      }
    })()

    /*
    Creates and returns a scale instance that maps the `color_mapper` range
    (low to high) to a screen space range equal to the length of the ColorBar's
    scale image. The scale is used to calculate the tick coordinates in screen
    coordinates for plotting purposes.

    Note: the type of color_mapper has to match the type of scale (i.e.
    a LinearColorMapper will require a corresponding LinearScale instance).
    */

    const x_range = new Range1d({
      start: color_mapper.metrics.min,
      end: color_mapper.metrics.max,
    })
    const x_scale = (() => {
      if (color_mapper instanceof LinearColorMapper)
        return new LinearScale()
      else if (color_mapper instanceof LogColorMapper)
        return new LogScale()
      else if (color_mapper instanceof ScanningColorMapper) {
        const {binning} = color_mapper.metrics
        return new LinearInterpolationScale({binning})
      } else {
        // TODO: Categorical*Mapper
        unreachable()
      }
    })()

    const y_range = new Range1d({start: 0, end: 1})
    const y_scale = new LinearScale()

    if (this.model.orientation == "horizontal")
      this._frame = new CartesianFrame(x_scale, y_scale, x_range, y_range)
    else
      this._frame = new CartesianFrame(y_scale, x_scale, y_range, x_range)

    this._axis = new Axis({
      ticker: this._ticker,
      formatter: this._formatter,
      major_tick_in: this.model.major_tick_in,
      major_tick_out: this.model.major_tick_out,
      minor_tick_in: this.model.minor_tick_in,
      minor_tick_out: this.model.minor_tick_out,
      major_label_standoff: this.model.label_standoff,
      major_label_overrides: this.model.major_label_overrides,
      //this.visuals.major_label_text
      //this.visuals.major_tick_line
      //this.visuals.minor_tick_line
    })

    this._title = new Title({
      text: this.model.title,
      // title_standoff
      // this.visuals.title_text
    })

    this._set_canvas_image()
  }

  async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const self = this
    const parent: any = {
      get parent() {
        return self.parent
      },
      get root() {
        return self.root
      },
      get frame() {
        return self._frame
      },
      get canvas_view() {
        return self.parent.canvas_view
      },
      request_layout() {
        self.parent.request_layout()
      },
    }

    this._axis_view = await build_view(this._axis, {parent})
    this._title_view = await build_view(this._title, {parent})
  }

  remove(): void {
    this._title_view.remove()
    this._axis_view.remove()
    super.remove()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this._ticker.change, () => this.request_render())
    this.connect(this._formatter.change, () => this.request_render())
    this.connect(this.model.color_mapper.change, () => {
      this._set_canvas_image()
      this.request_render()
    })
  }

  protected _set_canvas_image(): void {
    const {orientation} = this.model

    const palette = (() => {
      const {palette} = this.model.color_mapper
      if (orientation == "vertical")
        return reversed(palette)
      else
        return palette
    })()

    const [w, h] = (() => {
      if (orientation == "vertical")
        return [1, palette.length]
      else
        return [palette.length, 1]
    })()

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const image_ctx = canvas.getContext('2d')!
    const image_data = image_ctx.getImageData(0, 0, w, h)

    // We always want to draw the entire palette linearly, so we create a new
    // LinearColorMapper instance and map a monotonic range of values with
    // length = palette.length to get each palette color in order.
    const cmap = new LinearColorMapper({palette}).rgba_mapper
    const buf8 = cmap.v_compute(range(0, palette.length))
    image_data.data.set(buf8)
    image_ctx.putImageData(image_data, 0, 0)

    this.image = canvas
  }

  update_layout(): void {
    const {orientation, location, width: w, height: h, padding} = this.model

    const top_panel    = new VStack()
    const bottom_panel = new VStack()
    const left_panel   = new HStack()
    const right_panel  = new HStack()

    const layout = new BorderLayout()
    layout.center_panel = this._frame
    layout.top_panel    = top_panel
    layout.bottom_panel = bottom_panel
    layout.left_panel   = left_panel
    layout.right_panel  = right_panel

    const [valign, halign] = (() => {
      switch (location) {
        case "top_left":
          return ["start", "start"] as const
        case "top_center":
          return ["start", "center"] as const
        case "top_right":
          return ["start", "end"] as const
        case "bottom_left":
          return ["end", "start"] as const
        case "bottom_center":
          return ["end", "center"] as const
        case "bottom_right":
          return ["end", "end"] as const
        case "center_left":
          return ["center", "start"] as const
        case "center":
          return ["center", "center"] as const
        case "center_right":
          return ["center", "end"] as const
        default:
          unreachable()
      }
    })()

    const margin = {left: padding, right: padding, top: padding, bottom: padding}
    if (orientation == "horizontal") {
      const width = w == "auto" ? undefined : w
      const height = h == "auto" ? SHORT_DIM : h

      layout.set_sizing({width_policy: "max", height_policy: "fit", margin, halign, valign})
      layout.center_panel.set_sizing({width_policy: w == "auto" ? "fit" : "fixed", height_policy: "fixed", width, height})
    } else {
      const width = w == "auto" ? SHORT_DIM : w
      const height = h == "auto" ? undefined : h

      layout.set_sizing({width_policy: "fit", height_policy: "max", margin, halign, valign})
      layout.center_panel.set_sizing({width_policy: "fixed", height_policy: h == "auto" ? "fit" : "fixed", width, height})
    }

    top_panel.set_sizing({width_policy: "fit", height_policy: "min"})
    bottom_panel.set_sizing({width_policy: "fit", height_policy: "min"})
    left_panel.set_sizing({width_policy: "min", height_policy: "fit"})
    right_panel.set_sizing({width_policy: "min", height_policy: "fit"})

    const {_title_view} = this
    if (orientation == "horizontal") {
      _title_view.panel = new Panel("above")
      _title_view.update_layout()
      top_panel.children.push(_title_view.layout)
    } else {
      _title_view.panel = new Panel("left")
      _title_view.update_layout()
      left_panel.children.push(_title_view.layout)
    }

    const {panel} = this
    const side = (() => {
      if (panel == null) {
        return orientation == "horizontal" ? "below" : "right"
      } else {
        return panel.side
      }
    })()

    const stack = (() => {
      switch (side) {
        case "above":
          return top_panel
        case "below":
          return bottom_panel
        case "left":
          return left_panel
        case "right":
          return right_panel
      }
    })()

    const {_axis_view} = this
    _axis_view.panel = new Panel(side)
    _axis_view.update_layout()
    stack.children.push(_axis_view.layout)

    const outer = new Grid([{layout, row: 0, col: 0}])
    outer.absolute = true

    if (orientation == "horizontal") {
      outer.set_sizing({width_policy: "max", height_policy: "min"})
    } else {
      outer.set_sizing({width_policy: "min", height_policy: "max"})
    }

    this._outer_layout = outer
    this._inner_layout = layout

    this.layout = this._outer_layout
  }

  protected _render(): void {
    const {ctx} = this.layer
    ctx.save()
    this._paint_bbox(ctx, this._outer_layout.bbox)
    const {x, y} = this._inner_layout.bbox
    ctx.translate(x, y)
    this._paint_image(ctx, this._inner_layout.center_panel.bbox)
    this._title_view.render()
    this._axis_view.render()
    ctx.restore()
  }

  protected _paint_bbox(ctx: Context2d, bbox: BBox): void {
    const {x, y, width, height} = bbox
    ctx.save()
    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_value(ctx)
      ctx.fillRect(x, y, width, height)
    }
    if (this.visuals.border_line.doit) {
      this.visuals.border_line.set_value(ctx)
      ctx.strokeRect(x, y, width, height)
    }
    ctx.restore()
  }

  protected _paint_image(ctx: Context2d, bbox: BBox): void {
    const {x, y, width, height} = bbox
    ctx.save()
    ctx.setImageSmoothingEnabled(false)
    ctx.globalAlpha = this.model.scale_alpha
    ctx.drawImage(this.image, x, y, width, height)
    if (this.visuals.bar_line.doit) {
      this.visuals.bar_line.set_value(ctx)
      ctx.strokeRect(x, y, width, height)
    }
    ctx.restore()
  }
}

export namespace ColorBar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    location: p.Property<LegendLocation | [number, number]>
    orientation: p.Property<Orientation>
    title: p.Property<string>
    title_standoff: p.Property<number>
    width: p.Property<number | "auto">
    height: p.Property<number | "auto">
    scale_alpha: p.Property<number>
    ticker: p.Property<Ticker | "auto">
    formatter: p.Property<TickFormatter | "auto">
    major_label_overrides: p.Property<{[key: string]: string}>
    color_mapper: p.Property<ContinuousColorMapper>
    label_standoff: p.Property<number>
    margin: p.Property<number>
    padding: p.Property<number>
    major_tick_in: p.Property<number>
    major_tick_out: p.Property<number>
    minor_tick_in: p.Property<number>
    minor_tick_out: p.Property<number>
  } & Mixins

  export type Mixins =
    mixins.MajorLabelText &
    mixins.TitleText      &
    mixins.MajorTickLine  &
    mixins.MinorTickLine  &
    mixins.BorderLine     &
    mixins.BarLine        &
    mixins.BackgroundFill

  export type Visuals = Annotation.Visuals & {
    major_label_text: visuals.Text
    title_text: visuals.Text
    major_tick_line: visuals.Line
    minor_tick_line: visuals.Line
    border_line: visuals.Line
    bar_line: visuals.Line
    background_fill: visuals.Fill
  }
}

export interface ColorBar extends ColorBar.Attrs {}

export class ColorBar extends Annotation {
  properties: ColorBar.Props
  __view_type__: ColorBarView

  constructor(attrs?: Partial<ColorBar.Attrs>) {
    super(attrs)
  }

  static init_ColorBar(): void {
    this.prototype.default_view = ColorBarView

    this.mixins<ColorBar.Mixins>([
      ["major_label_", mixins.Text],
      ["title_",       mixins.Text],
      ["major_tick_",  mixins.Line],
      ["minor_tick_",  mixins.Line],
      ["border_",      mixins.Line],
      ["bar_",         mixins.Line],
      ["background_",  mixins.Fill],
    ])

    this.define<ColorBar.Props>(({Alpha, Number, String, Tuple, Dict, Or, Ref, Auto}) => ({
      location:              [ Or(LegendLocation, Tuple(Number, Number)), "top_right" ],
      orientation:           [ Orientation, "vertical" ],
      title:                 [ String ],
      title_standoff:        [ Number, 2 ],
      width:                 [ Or(Number, Auto), "auto" ],
      height:                [ Or(Number, Auto), "auto" ],
      scale_alpha:           [ Alpha, 1.0 ],
      ticker:                [ Or(Ref(Ticker), Auto), () => new BasicTicker() ],               // TODO: obj -> "auto"
      formatter:             [ Or(Ref(TickFormatter), Auto), () => new BasicTickFormatter() ], // TODO: obj -> "auto"
      major_label_overrides: [ Dict(String), {} ],
      color_mapper:          [ Ref(ContinuousColorMapper) ],
      label_standoff:        [ Number, 5 ],
      margin:                [ Number, 30 ],
      padding:               [ Number, 10 ],
      major_tick_in:         [ Number, 5 ],
      major_tick_out:        [ Number, 0 ],
      minor_tick_in:         [ Number, 0 ],
      minor_tick_out:        [ Number, 0 ],
    }))

    this.override<ColorBar.Props>({
      background_fill_color: "#ffffff",
      background_fill_alpha: 0.95,
      bar_line_color: null,
      border_line_color: null,
      major_label_text_align: "center",
      major_label_text_baseline: "middle",
      major_label_text_font_size: "11px",
      major_tick_line_color: "#ffffff",
      minor_tick_line_color: null,
      title_text_font_size: "13px",
      title_text_font_style: "italic",
    })
  }
}
