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
import {min, max, range, reversed} from "core/util/array"
import {isString, isArray} from "core/util/types"
import {Context2d} from "core/util/canvas"
import {Size, Grid, Layoutable} from "core/layout"
import {HStack, VStack} from "core/layout/alignments"
import {BorderLayout} from "core/layout/border"
import {SidePanel} from "core/layout/side_panel"
import {unreachable} from "core/util/assert"
import {build_view} from "core/build_views"
import {BBox} from "core/util/bbox"

const SHORT_DIM = 25
const LONG_DIM_MIN_SCALAR = 0.3
const LONG_DIM_MAX_SCALAR = 0.8

type ScreenPoint = {sx: number, sy: number}

export class ColorBarView extends AnnotationView {
  model: ColorBar
  visuals: ColorBar.Visuals

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
      _title_view.layout = new SidePanel("above", _title_view)
      top_panel.children.push(_title_view.layout)
    } else {
      _title_view.layout = new SidePanel("left", _title_view)
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
    _axis_view.layout = new SidePanel(side, _axis_view)
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
  }

  after_layout(): void {
    const panel = this.panel ?? this.plot_view.frame
    this._outer_layout.compute(panel.bbox.size)
  }

  protected _get_size(): Size {
    const image_size = this.compute_image_dimensions()
    return this.compute_legend_dimensions(image_size)
  }

  compute_legend_dimensions(image_size: Size): Size {
    const axis_size = this._axis_view.panel.get_oriented_size()
    const title_size = this._title_view.panel.get_oriented_size()

    const {padding} = this.model

    let width: number
    let height: number
    switch (this.model.orientation) {
      case "vertical":
        width = image_size.width + axis_size.width + title_size.width + 2*padding
        height = image_size.height + 2*padding
        break
      case "horizontal":
        width = image_size.width + 2*padding
        height = image_size.height + axis_size.height + title_size.height + 2*padding
        break
    }

    return {width, height}
  }

  compute_legend_location(legend_size: Size): ScreenPoint {
    const legend_margin = this.model.margin

    const panel = this.panel ?? this.plot_view.frame
    const [hr, vr] = panel.bbox.ranges
    const {location} = this.model

    let sx: number
    let sy: number
    if (isString(location)) {
      switch (location) {
        case 'top_left':
          sx = hr.start + legend_margin
          sy = vr.start + legend_margin
          break
        case 'top_center':
          sx = (hr.end + hr.start)/2 - legend_size.width/2
          sy = vr.start + legend_margin
          break
        case 'top_right':
          sx = hr.end - legend_margin - legend_size.width
          sy = vr.start + legend_margin
          break
        case 'bottom_right':
          sx = hr.end - legend_margin - legend_size.width
          sy = vr.end - legend_margin - legend_size.height
          break
        case 'bottom_center':
          sx = (hr.end + hr.start)/2 - legend_size.width/2
          sy = vr.end - legend_margin - legend_size.height
          break
        case 'bottom_left':
          sx = hr.start + legend_margin
          sy = vr.end - legend_margin - legend_size.height
          break
        case 'center_left':
          sx = hr.start + legend_margin
          sy = (vr.end + vr.start)/2 - legend_size.height/2
          break
        case 'center':
          sx = (hr.end + hr.start)/2 - legend_size.width/2
          sy = (vr.end + vr.start)/2 - legend_size.height/2
          break
        case 'center_right':
          sx = hr.end - legend_margin - legend_size.width
          sy = (vr.end + vr.start)/2 - legend_size.height/2
          break
      }
    } else if (isArray(location) && location.length == 2) {
      const [vx, vy] = location
      sx = panel.xview.compute(vx)
      sy = panel.yview.compute(vy) - legend_size.height
    } else
      unreachable()

    return {sx, sy}
  }

  protected _render(): void {
    const {ctx} = this.layer

    const panel = this.panel ?? this.plot_view.frame
    ctx.save()
    const {x, y} = panel.bbox
    ctx.translate(x, y)
    this._paint_bbox(ctx, this._outer_layout.bbox)

    const {x: xl, y: yl} = this._inner_layout.bbox
    ctx.translate(xl, yl)
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

  compute_image_dimensions(): Size {
    /*
    Heuristics to determine ColorBar image dimensions if set to "auto".

    Note: Returns the height/width values for the ColorBar's scale image, not
    the dimensions of the entire ColorBar.

    If the short dimension (the width of a vertical bar or height of a
    horizontal bar) is set to "auto", the resulting dimension will be set to
    25 px.

    For a ColorBar in a side panel with the long dimension (the height of a
    vertical bar or width of a horizontal bar) set to "auto", the
    resulting dimension will be as long as the adjacent frame edge, so that the
    bar "fits" to the plot.

    For a ColorBar in the plot frame with the long dimension set to "auto", the
    resulting dimension will be the greater of:
      * The length of the color palette * 25px
      * The parallel frame dimension * 0.30
        (i.e the frame height for a vertical ColorBar)
    But not greater than:
      * The parallel frame dimension * 0.80
    */
    const {bbox} = this.panel ?? this.plot_view.frame
    const {padding} = this.model

    let width: number
    let height: number

    switch (this.model.orientation) {
      case "vertical": {
        if (this.model.height == 'auto') {
          const title_size = this._title_view.panel.get_oriented_size()
          if (this.panel != null)
            height = bbox.height - 2*padding - title_size.height
          else {
            height = max([this.model.color_mapper.palette.length*SHORT_DIM, bbox.height*LONG_DIM_MIN_SCALAR])
            height = min([height, bbox.height*LONG_DIM_MAX_SCALAR - 2*padding - title_size.height])
          }
        } else
          height = this.model.height

        width = this.model.width == 'auto' ? SHORT_DIM : this.model.width
        break
      }
      case "horizontal": {
        height = this.model.height == 'auto' ? SHORT_DIM : this.model.height

        if (this.model.width == 'auto') {
          if (this.panel != null)
            width = bbox.width - 2*padding
          else {
            width = max([this.model.color_mapper.palette.length*SHORT_DIM, bbox.width*LONG_DIM_MIN_SCALAR])
            width = min([width, bbox.width*LONG_DIM_MAX_SCALAR - 2*padding])
          }
        } else
          width = this.model.width
        break
      }
    }

    return {width, height}
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
