import {Annotation, AnnotationView} from "./annotation"
import {Title} from "./title"
import {CartesianFrame} from "../canvas/cartesian_frame"
import {Axis, CategoricalAxis} from "../axes"
import {Ticker} from "../tickers/ticker"
import {BasicTicker, LogTicker, BinnedTicker, CategoricalTicker} from "../tickers"
import {TickFormatter} from "../formatters/tick_formatter"
import {BasicTickFormatter, LogTickFormatter, CategoricalTickFormatter} from "../formatters"
import {LabelingPolicy, NoOverlap} from "../policies/labeling"
import {ColorMapper} from "../mappers/color_mapper"
import {ContinuousColorMapper} from "../mappers/continuous_color_mapper"
import {LinearColorMapper, LogColorMapper, ScanningColorMapper, CategoricalColorMapper} from "../mappers"
import {Scale, LinearScale, LogScale, LinearInterpolationScale, CategoricalScale} from "../scales"
import {Range, Range1d, FactorRange} from "../ranges"

import {Anchor, Orientation} from "core/enums"
import * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import * as p from "core/properties"
import {range, reversed} from "core/util/array"
import {Context2d} from "core/util/canvas"
import {Grid, Layoutable, SizingPolicy, Percent} from "core/layout"
import {HStack, VStack, NodeLayout} from "core/layout/alignments"
import {BorderLayout} from "core/layout/border"
import {Panel} from "core/layout/side_panel"
import {unreachable} from "core/util/assert"
import {build_view} from "core/build_views"
import {BBox} from "core/util/bbox"
import {isString} from "core/util/types"
import {SerializableState} from "core/view"

const MINOR_DIM = 25
const MAJOR_DIM_MIN_SCALAR = 0.3
const MAJOR_DIM_MAX_SCALAR = 0.8

export class ColorBarView extends AnnotationView {
  model: ColorBar
  visuals: ColorBar.Visuals
  layout: Layoutable

  protected _image: HTMLCanvasElement

  protected _frame: CartesianFrame

  protected _axis: Axis
  protected _axis_view: Axis["__view_type__"]

  protected _title?: Title
  protected _title_view?: Title["__view_type__"]

  protected _ticker: Ticker
  protected _formatter: TickFormatter

  protected _inner_layout: BorderLayout

  protected _major_range: Range
  protected _major_scale: Scale
  protected _minor_range: Range
  protected _minor_scale: Scale

  private _orientation: Orientation
  get orientation(): Orientation {
    return this._orientation
  }

  initialize(): void {
    super.initialize()

    const {ticker, formatter, color_mapper} = this.model

    this._ticker = ticker != "auto" ? ticker : (() => {
      switch (true) {
        case color_mapper instanceof LogColorMapper:
          return new LogTicker()
        case color_mapper instanceof ScanningColorMapper:
          return new BinnedTicker({mapper: color_mapper as ScanningColorMapper})
        case color_mapper instanceof CategoricalColorMapper:
          return new CategoricalTicker()
        default:
          return new BasicTicker()
      }
    })()

    this._formatter = formatter != "auto" ? formatter : (() => {
      switch (true) {
        case this._ticker instanceof LogTicker:
          return new LogTickFormatter()
        case color_mapper instanceof CategoricalColorMapper:
          return new CategoricalTickFormatter()
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
    this._major_range = (() => {
      if (color_mapper instanceof CategoricalColorMapper) {
        const {factors} = color_mapper
        return new FactorRange({factors})
      } else if (color_mapper instanceof ContinuousColorMapper) {
        const {min, max} = color_mapper.metrics
        return new Range1d({start: min, end: max})
      } else
        unreachable()
    })()

    this._major_scale = (() => {
      if (color_mapper instanceof LinearColorMapper)
        return new LinearScale()
      else if (color_mapper instanceof LogColorMapper)
        return new LogScale()
      else if (color_mapper instanceof ScanningColorMapper) {
        const {binning} = color_mapper.metrics
        return new LinearInterpolationScale({binning})
      } else if (color_mapper instanceof CategoricalColorMapper) {
        return new CategoricalScale()
      } else
        unreachable()
    })()

    this._minor_range = new Range1d({start: 0, end: 1})
    this._minor_scale = new LinearScale()

    const major_label_text = mixins.attrs_of(this.model, "major_label_", mixins.Text, true)
    const major_tick_line = mixins.attrs_of(this.model, "major_tick_", mixins.Line, true)
    const minor_tick_line = mixins.attrs_of(this.model, "minor_tick_", mixins.Line, true)
    const title_text = mixins.attrs_of(this.model, "title_", mixins.Text)

    const AxisCls = color_mapper instanceof CategoricalColorMapper ? CategoricalAxis : Axis
    this._axis = new AxisCls({
      ticker: this._ticker,
      formatter: this._formatter,
      major_tick_in: this.model.major_tick_in,
      major_tick_out: this.model.major_tick_out,
      minor_tick_in: this.model.minor_tick_in,
      minor_tick_out: this.model.minor_tick_out,
      major_label_standoff: this.model.label_standoff,
      major_label_overrides: this.model.major_label_overrides,
      major_label_policy: this.model.major_label_policy,
      axis_line_color: null,
      ...major_label_text,
      ...major_tick_line,
      ...minor_tick_line,
    })

    const {title} = this.model
    if (title) {
      this._title = new Title({
        text: title,
        standoff: this.model.title_standoff,
        ...title_text,
      })
    }
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
    if (this._title != null)
      this._title_view = await build_view(this._title, {parent})
  }

  remove(): void {
    this._title_view?.remove()
    this._axis_view.remove()
    super.remove()
  }

  connect_signals(): void {
    super.connect_signals()
    // TODO: this.connect(this.model.change, () => this.plot_view.invalidate_layout())
    this.connect(this._ticker.change, () => this.request_render())
    this.connect(this._formatter.change, () => this.request_render())
    this.connect(this.model.color_mapper.metrics_change, () => {
      const range = this._major_range
      const scale = this._major_scale

      const {color_mapper} = this.model

      if (color_mapper instanceof ContinuousColorMapper && range instanceof Range1d) {
        const {min, max} = color_mapper.metrics
        range.setv({start: min, end: max})
      }

      if (color_mapper instanceof ScanningColorMapper && scale instanceof LinearInterpolationScale) {
        const {binning} = color_mapper.metrics
        scale.binning = binning
      }

      this._set_canvas_image()
      this.plot_view.request_layout() // this.request_render()
    })
  }

  protected _set_canvas_image(): void {
    const {orientation} = this

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

    const canvas = this._image = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const image_ctx = canvas.getContext("2d")!
    const image_data = image_ctx.getImageData(0, 0, w, h)

    // We always want to draw the entire palette linearly, so we create a new
    // LinearColorMapper instance and map a monotonic range of values with
    // length = palette.length to get each palette color in order.
    const cmap = new LinearColorMapper({palette}).rgba_mapper
    const buf8 = cmap.v_compute(range(0, palette.length))
    image_data.data.set(buf8)
    image_ctx.putImageData(image_data, 0, 0)
  }

  update_layout(): void {
    const {location, width: w, height: h, padding, margin} = this.model

    const [valign, halign] = (() => {
      if (isString(location)) {
        switch (location) {
          case "top_left":
            return ["start", "start"] as const
          case "top":
          case "top_center":
            return ["start", "center"] as const
          case "top_right":
            return ["start", "end"] as const
          case "bottom_left":
            return ["end", "start"] as const
          case "bottom":
          case "bottom_center":
            return ["end", "center"] as const
          case "bottom_right":
            return ["end", "end"] as const
          case "left":
          case "center_left":
            return ["center", "start"] as const
          case "center":
          case "center_center":
            return ["center", "center"] as const
          case "right":
          case "center_right":
            return ["center", "end"] as const
        }
      } else
        return ["end", "start"] as const // "bottom_left"
    })()

    const orientation = this._orientation = (() => {
      const {orientation} = this.model
      if (orientation == "auto") {
        if (this.panel != null)
          return this.panel.is_horizontal ? "horizontal" : "vertical"
        else {
          if (halign == "start" || halign == "end" || (halign == "center" && valign == "center"))
            return "vertical"
          else
            return "horizontal"
        }
      } else
        return orientation
    })()

    const center_panel = new NodeLayout()
    const top_panel    = new VStack()
    const bottom_panel = new VStack()
    const left_panel   = new HStack()
    const right_panel  = new HStack()

    center_panel.absolute = true
    top_panel.absolute = true
    bottom_panel.absolute = true
    left_panel.absolute = true
    right_panel.absolute = true

    const [x_scale, y_scale, x_range, y_range] = (() => {
      if (orientation == "horizontal")
        return [this._major_scale, this._minor_scale, this._major_range, this._minor_range] as const
      else
        return [this._minor_scale, this._major_scale, this._minor_range, this._major_range] as const
    })()
    this._frame = new CartesianFrame(x_scale, y_scale, x_range, y_range)

    center_panel.on_resize((bbox) => this._frame.set_geometry(bbox))

    const layout = new BorderLayout()
    this._inner_layout = layout
    layout.absolute = true

    layout.center_panel = center_panel
    layout.top_panel    = top_panel
    layout.bottom_panel = bottom_panel
    layout.left_panel   = left_panel
    layout.right_panel  = right_panel

    const padding_box = {left: padding, right: padding, top: padding, bottom: padding}
    const margin_box = (() => {
      if (this.panel == null) {
        if (isString(location))
          return {left: margin, right: margin, top: margin, bottom: margin}
        else {
          const [left, bottom] = location
          return {left, right: margin, top: margin, bottom}
        }
      } else {
        if (isString(location))
          return undefined
        else {
          const [left, bottom] = location
          return {left, right: 0, top: 0, bottom}
        }
      }
    })()

    layout.padding = padding_box

    let major_policy: SizingPolicy
    let major_size: number | undefined
    let min_major_size: number | Percent | undefined
    let max_major_size: number | Percent | undefined
    if (this.panel != null) {
      major_policy = "max"
      major_size = undefined
      min_major_size = undefined
      max_major_size = undefined
    } else {
      if ((orientation == "horizontal" ? w : h) == "auto") {
        major_policy = "fixed"
        major_size = this.model.color_mapper.palette.length*MINOR_DIM
        min_major_size = {percent: MAJOR_DIM_MIN_SCALAR}
        max_major_size = {percent: MAJOR_DIM_MAX_SCALAR}
      } else {
        major_policy = "fit"
        major_size = undefined
      }
    }

    if (orientation == "horizontal") {
      const width = w == "auto" ? undefined : w
      const height = h == "auto" ? MINOR_DIM : h

      layout.set_sizing({
        width_policy: major_policy, height_policy: "min",
        width: major_size, min_width: min_major_size, max_width: max_major_size,
        halign, valign, margin: margin_box,
      })
      layout.center_panel.set_sizing({width_policy: w == "auto" ? "fit" : "fixed", height_policy: "fixed", width, height})
    } else {
      const width = w == "auto" ? MINOR_DIM : w
      const height = h == "auto" ? undefined : h

      layout.set_sizing({
        width_policy: "min", height_policy: major_policy,
        height: major_size, min_height: min_major_size, max_height: max_major_size,
        halign, valign, margin: margin_box,
      })
      layout.center_panel.set_sizing({width_policy: "fixed", height_policy: h == "auto" ? "fit" : "fixed", width, height})
    }

    top_panel.set_sizing({width_policy: "fit", height_policy: "min"})
    bottom_panel.set_sizing({width_policy: "fit", height_policy: "min"})
    left_panel.set_sizing({width_policy: "min", height_policy: "fit"})
    right_panel.set_sizing({width_policy: "min", height_policy: "fit"})

    const {_title_view} = this
    if (_title_view != null) {
      if (orientation == "horizontal") {
        _title_view.panel = new Panel("above")
        _title_view.update_layout()
        top_panel.children.push(_title_view.layout)
      } else {
        _title_view.panel = new Panel("left")
        _title_view.update_layout()
        left_panel.children.push(_title_view.layout)
      }
    }

    const {panel} = this
    const side = (() => {
      if (panel != null && orientation == panel.orientation)
        return panel.side
      else
        return orientation == "horizontal" ? "below" : "right"
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

    if (this.panel != null) {
      const outer = new Grid([{layout, row: 0, col: 0}])
      outer.absolute = true

      if (orientation == "horizontal") {
        outer.set_sizing({width_policy: "max", height_policy: "min"})
      } else {
        outer.set_sizing({width_policy: "min", height_policy: "max"})
      }

      this.layout = outer
    } else {
      this.layout = this._inner_layout
    }

    const {visible} = this.model
    this.layout.sizing.visible = visible

    this._set_canvas_image()
  }

  protected _render(): void {
    const {ctx} = this.layer
    ctx.save()
    this._paint_bbox(ctx, this._inner_layout.bbox)
    this._paint_image(ctx, this._inner_layout.center_panel.bbox)
    this._title_view?.render()
    this._axis_view.render()
    ctx.restore()
  }

  protected _paint_bbox(ctx: Context2d, bbox: BBox): void {
    const {x, y} = bbox
    let {width, height} = bbox

    // XXX: shrink outline region by 1px to make right and bottom lines visible
    // if they are on the edge of the canvas.
    if (x + width >= this.parent.canvas_view.bbox.width) {
      width -= 1
    }
    if (y + height >= this.parent.canvas_view.bbox.height) {
      height -= 1
    }

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
    ctx.drawImage(this._image, x, y, width, height)
    if (this.visuals.bar_line.doit) {
      this.visuals.bar_line.set_value(ctx)
      ctx.strokeRect(x, y, width, height)
    }
    ctx.restore()
  }

  serializable_state(): SerializableState {
    const {children = [], ...state} = super.serializable_state()
    if (this._title_view != null)
      children.push(this._title_view.serializable_state())
    children.push(this._axis_view.serializable_state())
    return {...state, children}
  }
}

export namespace ColorBar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    location: p.Property<Anchor | [number, number]>
    orientation: p.Property<Orientation | "auto">
    title: p.Property<string | null>
    title_standoff: p.Property<number>
    width: p.Property<number | "auto">
    height: p.Property<number | "auto">
    scale_alpha: p.Property<number>
    ticker: p.Property<Ticker | "auto">
    formatter: p.Property<TickFormatter | "auto">
    major_label_overrides: p.Property<{[key: string]: string}>
    major_label_policy: p.Property<LabelingPolicy>
    color_mapper: p.Property<ColorMapper>
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

    this.define<ColorBar.Props>(({Alpha, Number, String, Tuple, Dict, Or, Ref, Auto, Nullable}) => ({
      location:              [ Or(Anchor, Tuple(Number, Number)), "top_right" ],
      orientation:           [ Or(Orientation, Auto), "auto" ],
      title:                 [ Nullable(String), null ],
      title_standoff:        [ Number, 2 ],
      width:                 [ Or(Number, Auto), "auto" ],
      height:                [ Or(Number, Auto), "auto" ],
      scale_alpha:           [ Alpha, 1.0 ],
      ticker:                [ Or(Ref(Ticker), Auto), "auto" ],
      formatter:             [ Or(Ref(TickFormatter), Auto), "auto" ],
      major_label_overrides: [ Dict(String), {} ],
      major_label_policy:    [ Ref(LabelingPolicy), () => new NoOverlap() ],
      color_mapper:          [ Ref(ColorMapper) ],
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
      major_label_text_font_size: "11px",
      major_tick_line_color: "#ffffff",
      minor_tick_line_color: null,
      title_text_font_size: "13px",
      title_text_font_style: "italic",
    })
  }
}
