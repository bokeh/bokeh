import {Annotation, AnnotationView} from "./annotation"
import {ContinuousTicker} from "../tickers/continuous_ticker"
import {TickFormatter} from "../formatters/tick_formatter"
import {BasicTicker} from "../tickers/basic_ticker"
import {BasicTickFormatter} from "../formatters/basic_tick_formatter"
import {ContinuousColorMapper} from "../mappers/continuous_color_mapper"
import {LinearColorMapper, LogColorMapper, ScanningColorMapper} from "../mappers"
import {LinearScale} from "../scales/linear_scale"
import {LinearInterpolationScale} from "../scales/linear_interpolation_scale"
import {Scale} from "../scales/scale"
import {LogScale} from "../scales/log_scale"
import {Range1d} from "../ranges/range1d"

import {Arrayable} from "core/types"
import {LegendLocation, Orientation} from "core/enums"
import * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import * as p from "core/properties"
import * as text_util from "core/util/text"
import {min, max, range, reversed, is_empty} from "core/util/array"
import {map} from "core/util/arrayable"
import {isString, isArray} from "core/util/types"
import {Context2d} from "core/util/canvas"
import {Size} from "core/layout"
import {unreachable} from "core/util/assert"

const SHORT_DIM = 25
const LONG_DIM_MIN_SCALAR = 0.3
const LONG_DIM_MAX_SCALAR = 0.8

export type Coords = [Arrayable<number>, Arrayable<number>]

export type TickInfo = {
  coords: {major: Coords, minor: Coords}
  labels: {major: string[]}
}

export class ColorBarView extends AnnotationView {
  model: ColorBar
  visuals: ColorBar.Visuals

  protected image: HTMLCanvasElement

  initialize(): void {
    super.initialize()
    this._set_canvas_image()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.ticker.change, () => this.plot_view.request_render())
    this.connect(this.model.formatter.change, () => this.plot_view.request_render())
    if (this.model.color_mapper != null) {
      this.connect(this.model.color_mapper.change, () => {
        this._set_canvas_image()
        this.plot_view.request_render()
      })
    }
  }

  protected _get_size(): Size {
    if (this.model.color_mapper == null)
      return {width: 0, height: 0}
    else {
      const {width, height} = this.compute_legend_dimensions()
      return {width, height}
    }
  }

  protected _set_canvas_image(): void {
    if (this.model.color_mapper == null)
      return

    let {palette} = this.model.color_mapper

    if (this.model.orientation == 'vertical')
      palette = reversed(palette)

    let w: number, h: number
    switch (this.model.orientation) {
      case "vertical": {
        [w, h] = [1, palette.length]
        break
      }
      case "horizontal": {
        [w, h] = [palette.length, 1]
        break
      }
    }

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

  compute_legend_dimensions(): {width: number, height: number} {
    const image_dimensions = this._computed_image_dimensions()
    const [image_height, image_width] = [image_dimensions.height, image_dimensions.width]

    const label_extent = this._get_label_extent()
    const title_extent = this._title_extent()
    const tick_extent = this._tick_extent()
    const {padding} = this.model

    let legend_height: number, legend_width: number
    switch (this.model.orientation) {
      case "vertical":
        legend_height = image_height + title_extent + 2*padding
        legend_width = image_width + tick_extent + label_extent + 2*padding
        break
      case "horizontal":
        legend_height = image_height + title_extent + tick_extent + label_extent + 2*padding
        legend_width = image_width + 2*padding
        break
    }

    return {width: legend_width, height: legend_height}
  }

  compute_legend_location(): {sx: number, sy: number} {
    const legend_dimensions = this.compute_legend_dimensions()
    const [legend_height, legend_width] = [legend_dimensions.height, legend_dimensions.width]

    const legend_margin = this.model.margin

    const panel = this.panel != null ? this.panel : this.plot_view.frame
    const [hr, vr] = panel.bbox.ranges
    const {location} = this.model

    let sx: number, sy: number
    if (isString(location)) {
      switch (location) {
        case 'top_left':
          sx = hr.start + legend_margin
          sy = vr.start + legend_margin
          break
        case 'top_center':
          sx = (hr.end + hr.start)/2 - legend_width/2
          sy = vr.start + legend_margin
          break
        case 'top_right':
          sx = hr.end - legend_margin - legend_width
          sy = vr.start + legend_margin
          break
        case 'bottom_right':
          sx = hr.end - legend_margin - legend_width
          sy = vr.end - legend_margin - legend_height
          break
        case 'bottom_center':
          sx = (hr.end + hr.start)/2 - legend_width/2
          sy = vr.end - legend_margin - legend_height
          break
        case 'bottom_left':
          sx = hr.start + legend_margin
          sy = vr.end - legend_margin - legend_height
          break
        case 'center_left':
          sx = hr.start + legend_margin
          sy = (vr.end + vr.start)/2 - legend_height/2
          break
        case 'center':
          sx = (hr.end + hr.start)/2 - legend_width/2
          sy = (vr.end + vr.start)/2 - legend_height/2
          break
        case 'center_right':
          sx = hr.end - legend_margin - legend_width
          sy = (vr.end + vr.start)/2 - legend_height/2
          break
      }
    } else if (isArray(location) && location.length == 2) {
      const [vx, vy] = location
      sx = panel.xview.compute(vx)
      sy = panel.yview.compute(vy) - legend_height
    } else
      unreachable()

    return {sx, sy}
  }

  protected _render(): void {
    if (this.model.color_mapper == null)
      return

    const {ctx} = this.layer
    ctx.save()

    const {sx, sy} = this.compute_legend_location()
    ctx.translate(sx, sy)
    this._draw_bbox(ctx)

    const image_offset = this._get_image_offset()
    ctx.translate(image_offset.x, image_offset.y)

    this._draw_image(ctx)

    const tick_info = this.tick_info()
    this._draw_major_ticks(ctx, tick_info)
    this._draw_minor_ticks(ctx, tick_info)
    this._draw_major_labels(ctx, tick_info)

    if (this.model.title)
      this._draw_title(ctx)

    ctx.restore()
  }

  protected _draw_bbox(ctx: Context2d): void {
    const bbox = this.compute_legend_dimensions()
    ctx.save()
    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_value(ctx)
      ctx.fillRect(0, 0, bbox.width, bbox.height)
    }
    if (this.visuals.border_line.doit) {
      this.visuals.border_line.set_value(ctx)
      ctx.strokeRect(0, 0, bbox.width, bbox.height)
    }
    ctx.restore()
  }

  protected _draw_image(ctx: Context2d): void {
    const image = this._computed_image_dimensions()
    ctx.save()
    ctx.setImageSmoothingEnabled(false)
    ctx.globalAlpha = this.model.scale_alpha
    ctx.drawImage(this.image, 0, 0, image.width, image.height)
    if (this.visuals.bar_line.doit) {
      this.visuals.bar_line.set_value(ctx)
      ctx.strokeRect(0, 0, image.width, image.height)
    }
    ctx.restore()
  }

  protected _draw_major_ticks(ctx: Context2d, tick_info: TickInfo): void {
    if (!this.visuals.major_tick_line.doit)
      return

    const [nx, ny] = this._normals()
    const image = this._computed_image_dimensions()
    const [x_offset, y_offset] = [image.width * nx, image.height * ny]

    const [sx, sy] = tick_info.coords.major
    const tin = this.model.major_tick_in
    const tout = this.model.major_tick_out

    ctx.save()
    ctx.translate(x_offset, y_offset)
    this.visuals.major_tick_line.set_value(ctx)
    for (let i = 0, end = sx.length; i < end; i++) {
      ctx.beginPath()
      ctx.moveTo(Math.round(sx[i] + nx*tout), Math.round(sy[i] + ny*tout))
      ctx.lineTo(Math.round(sx[i] - nx*tin), Math.round(sy[i] - ny*tin))
      ctx.stroke()
    }
    ctx.restore()
  }

  protected _draw_minor_ticks(ctx: Context2d, tick_info: TickInfo): void {
    if (!this.visuals.minor_tick_line.doit)
      return

    const [nx, ny] = this._normals()
    const image = this._computed_image_dimensions()
    const [x_offset, y_offset] = [image.width * nx, image.height * ny]

    const [sx, sy] = tick_info.coords.minor
    const tin = this.model.minor_tick_in
    const tout = this.model.minor_tick_out

    ctx.save()
    ctx.translate(x_offset, y_offset)
    this.visuals.minor_tick_line.set_value(ctx)
    for (let i = 0, end = sx.length; i < end; i++) {
      ctx.beginPath()
      ctx.moveTo(Math.round(sx[i] + nx*tout), Math.round(sy[i] + ny*tout))
      ctx.lineTo(Math.round(sx[i] - nx*tin), Math.round(sy[i] - ny*tin))
      ctx.stroke()
    }
    ctx.restore()
  }

  protected _draw_major_labels(ctx: Context2d, tick_info: TickInfo): void {
    if (!this.visuals.major_label_text.doit)
      return

    const [nx, ny] = this._normals()
    const image = this._computed_image_dimensions()
    const [x_offset, y_offset] = [image.width * nx, image.height * ny]
    const standoff = (this.model.label_standoff + this._tick_extent())
    const [x_standoff, y_standoff] = [standoff*nx, standoff*ny]

    const [sx, sy] = tick_info.coords.major

    const formatted_labels = tick_info.labels.major

    this.visuals.major_label_text.set_value(ctx)

    ctx.save()
    ctx.translate(x_offset + x_standoff, y_offset + y_standoff)
    for (let i = 0, end = sx.length; i < end; i++) {
      ctx.fillText(
        formatted_labels[i],
        Math.round(sx[i] + nx*this.model.label_standoff),
        Math.round(sy[i] + ny*this.model.label_standoff),
      )
    }
    ctx.restore()
  }

  protected _draw_title(ctx: Context2d): void {
    if (!this.visuals.title_text.doit)
      return

    ctx.save()
    this.visuals.title_text.set_value(ctx)
    ctx.fillText(this.model.title, 0, -this.model.title_standoff)
    ctx.restore()
  }

  /*protected*/ _get_label_extent(): number {
    const major_labels = this.tick_info().labels.major

    let label_extent: number
    if (!is_empty(major_labels)) {
      const {ctx} = this.layer
      ctx.save()
      this.visuals.major_label_text.set_value(ctx)
      switch (this.model.orientation) {
        case "vertical":
          label_extent = max((major_labels.map((label) => ctx.measureText(label.toString()).width)))
          break
        case "horizontal":
          label_extent = text_util.measure_font(this.visuals.major_label_text.font_value()).height
          break
      }

      label_extent += this.model.label_standoff
      ctx.restore()
    } else
      label_extent = 0

    return label_extent
  }

  /*protected*/ _get_image_offset(): {x: number, y: number} {
    // Returns image offset relative to legend bounding box
    const x = this.model.padding
    const y = this.model.padding + this._title_extent()
    return {x, y}
  }

  // {{{ TODO: state
  _normals(): [number, number] {
    return this.model.orientation == 'vertical' ? [1, 0] : [0, 1]
  }

  _title_extent(): number {
    const font_value = this.model.title_text_font + " " + this.model.title_text_font_size + " " + this.model.title_text_font_style
    const title_extent = this.model.title ? text_util.measure_font(font_value).height + this.model.title_standoff : 0
    return title_extent
  }

  _tick_extent(): number {
    return max([this.model.major_tick_out, this.model.minor_tick_out])
  }

  _computed_image_dimensions(): {height: number, width: number} {
    /*
    Heuristics to determine ColorBar image dimensions if set to "auto"

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

    const frame_height = this.plot_view.frame.bbox.height
    const frame_width = this.plot_view.frame.bbox.width
    const title_extent = this._title_extent()

    let height: number, width: number
    switch (this.model.orientation) {
      case "vertical": {
        if (this.model.height == 'auto') {
          if (this.panel != null)
            height = frame_height - 2*this.model.padding - title_extent
          else {
            height = max([this.model.color_mapper.palette.length*SHORT_DIM, frame_height*LONG_DIM_MIN_SCALAR])
            height = min([height, frame_height*LONG_DIM_MAX_SCALAR - 2*this.model.padding - title_extent])
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
            width = frame_width - 2*this.model.padding
          else {
            width = max([this.model.color_mapper.palette.length*SHORT_DIM, frame_width*LONG_DIM_MIN_SCALAR])
            width = min([width, frame_width*LONG_DIM_MAX_SCALAR - 2*this.model.padding])
          }
        } else
          width = this.model.width
        break
      }
    }

    return {width, height}
  }

  /*protected*/ _tick_coordinate_scale(scale_length: number): Scale {
    /*
    Creates and returns a scale instance that maps the `color_mapper` range
    (low to high) to a screen space range equal to the length of the ColorBar's
    scale image. The scale is used to calculate the tick coordinates in screen
    coordinates for plotting purposes.

    Note: the type of color_mapper has to match the type of scale (i.e.
    a LinearColorMapper will require a corresponding LinearScale instance).
    */

    const ranges = {
      source_range: new Range1d({
        start: this.model.color_mapper.metrics.min,
        end: this.model.color_mapper.metrics.max,
      }),
      target_range: new Range1d({
        start: 0,
        end: scale_length,
      }),
    }

    const {color_mapper} = this.model
    if (color_mapper instanceof LinearColorMapper)
      return new LinearScale(ranges)
    else if (color_mapper instanceof LogColorMapper)
      return new LogScale(ranges)
    else if (color_mapper instanceof ScanningColorMapper) {
      const {binning} = color_mapper.metrics
      return new LinearInterpolationScale({...ranges, binning})
    } else {
      // TODO: Categorical*Mapper needs painters
      unreachable()
    }
  }

  protected _format_major_labels(initial_labels: number[], major_ticks: Arrayable<number>): string[] {
    // XXX: passing null as cross_loc probably means MercatorTickFormatters, etc
    // will not function properly in conjunction with colorbars
    const formatted_labels = this.model.formatter.doFormat(initial_labels, null as any)

    for (let i = 0, end = major_ticks.length; i < end; i++) {
      if (major_ticks[i] in this.model.major_label_overrides)
        formatted_labels[i] = this.model.major_label_overrides[major_ticks[i]]
    }

    return formatted_labels
  }

  tick_info(): TickInfo {
    const image_dimensions = this._computed_image_dimensions()

    let scale_length: number
    switch (this.model.orientation) {
      case "vertical": {
        scale_length = image_dimensions.height
        break
      }
      case "horizontal": {
        scale_length = image_dimensions.width
        break
      }
    }

    const scale = this._tick_coordinate_scale(scale_length)
    const [i, j] = this._normals()
    const [start, end] = [this.model.color_mapper.metrics.min, this.model.color_mapper.metrics.max]

    // XXX: passing null as cross_loc probably means MercatorTickers, etc
    // will not function properly in conjunction with colorbars
    const ticks = this.model.ticker.get_ticks(start, end, null, null, this.model.ticker.desired_num_ticks)

    const majors = ticks.major
    const minors = ticks.minor

    const major_coords: [number[], number[]] = [[], []]
    const minor_coords: [number[], number[]] = [[], []]

    for (let ii = 0, _end = majors.length; ii < _end; ii++) {
      if (majors[ii] < start || majors[ii] > end)
        continue

      major_coords[i].push(majors[ii])
      major_coords[j].push(0)
    }

    for (let ii = 0, _end = minors.length; ii < _end; ii++) {
      if (minors[ii] < start || minors[ii] > end)
        continue

      minor_coords[i].push(minors[ii])
      minor_coords[j].push(0)
    }

    const labels = {major: this._format_major_labels(major_coords[i], majors)}

    const coords: {major: Coords, minor: Coords} = {
      major: [[], []],
      minor: [[], []],
    }

    coords.major[i] = scale.v_compute(major_coords[i])
    coords.minor[i] = scale.v_compute(minor_coords[i])

    coords.major[j] = major_coords[j]
    coords.minor[j] = minor_coords[j]

    // Because we want the scale to be reversed
    if (this.model.orientation == 'vertical') {
      coords.major[i] = map(coords.major[i], (coord) => scale_length - coord)
      coords.minor[i] = map(coords.minor[i], (coord) => scale_length - coord)
    }

    return {coords, labels}
  }
  // }}}
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
    ticker: p.Property<ContinuousTicker>
    formatter: p.Property<TickFormatter>
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

    this.define<ColorBar.Props>({
      location:                [ p.Any,         'top_right' ],
      orientation:             [ p.Orientation, 'vertical'  ],
      title:                   [ p.String                   ],
      title_standoff:          [ p.Number,      2           ],
      width:                   [ p.Any,         'auto'      ],
      height:                  [ p.Any,         'auto'      ],
      scale_alpha:             [ p.Number,      1.0         ],
      ticker:                  [ p.Instance,    () => new BasicTicker()        ],
      formatter:               [ p.Instance,    () => new BasicTickFormatter() ],
      major_label_overrides:   [ p.Any,         {}          ],
      color_mapper:            [ p.Instance                 ],
      label_standoff:          [ p.Number,      5           ],
      margin:                  [ p.Number,      30          ],
      padding:                 [ p.Number,      10          ],
      major_tick_in:           [ p.Number,      5           ],
      major_tick_out:          [ p.Number,      0           ],
      minor_tick_in:           [ p.Number,      0           ],
      minor_tick_out:          [ p.Number,      0           ],
    })

    this.override({
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
