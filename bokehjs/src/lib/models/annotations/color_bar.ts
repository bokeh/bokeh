import {BaseColorBar, BaseColorBarView} from "./base_color_bar"
import {Axis, CategoricalAxis, LinearAxis, LogAxis} from "../axes"
import {TickFormatter} from "../formatters/tick_formatter"
import {BasicTickFormatter, LogTickFormatter, CategoricalTickFormatter} from "../formatters"
import {ColorMapper} from "../mappers/color_mapper"
import {LinearColorMapper, LogColorMapper, ScanningColorMapper, CategoricalColorMapper, ContinuousColorMapper} from "../mappers"
import {Range, Range1d, FactorRange} from "../ranges"
import {Scale, LinearScale, LogScale, LinearInterpolationScale, CategoricalScale} from "../scales"
import {Ticker} from "../tickers/ticker"
import {BasicTicker, LogTicker, BinnedTicker, CategoricalTicker} from "../tickers"
import * as p from "core/properties"
import {Layoutable} from "core/layout"
import {range, reversed} from "core/util/array"
import {unreachable} from "core/util/assert"
import {BBox} from "core/util/bbox"
import {Context2d} from "core/util/canvas"

export class ColorBarView extends BaseColorBarView {
  override model: ColorBar
  override layout: Layoutable

  protected _image: HTMLCanvasElement

  override connect_signals(): void {
    super.connect_signals()

    this.connect(this.model.properties.color_mapper.change, async () => {
      this._title_view.remove()
      this._axis_view.remove()
      this.initialize()
      await this.lazy_initialize()
      this.plot_view.invalidate_layout()
    })
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

  override update_layout(): void {
    super.update_layout()

    this._set_canvas_image()
  }

  override _create_axis(): Axis {
    const {color_mapper} = this.model

    if (color_mapper instanceof CategoricalColorMapper)
      return new CategoricalAxis()
    else if (color_mapper instanceof LogColorMapper)
      return new LogAxis()
    else
      return new LinearAxis()
  }

  override _create_formatter(): TickFormatter {
    const {color_mapper} = this.model

    if (this._ticker instanceof LogTicker)
      return new LogTickFormatter()
    else if (color_mapper instanceof CategoricalColorMapper)
      return new CategoricalTickFormatter()
    else
      return new BasicTickFormatter()
  }

  override _create_major_range(): Range {
    /*
    Creates and returns a scale instance that maps the `color_mapper` range
    (low to high) to a screen space range equal to the length of the ColorBar's
    scale image. The scale is used to calculate the tick coordinates in screen
    coordinates for plotting purposes.

    Note: the type of color_mapper has to match the type of scale (i.e.
    a LinearColorMapper will require a corresponding LinearScale instance).
    */
    const {color_mapper} = this.model

    if (color_mapper instanceof CategoricalColorMapper)
      return new FactorRange({factors: color_mapper.factors})
    else if (color_mapper instanceof ContinuousColorMapper)
      return new Range1d({start: color_mapper.metrics.min, end: color_mapper.metrics.max})
    else
      unreachable()
  }

  override _create_major_scale(): Scale {
    const {color_mapper} = this.model

    if (color_mapper instanceof LinearColorMapper)
      return new LinearScale()
    else if (color_mapper instanceof LogColorMapper)
      return new LogScale()
    else if (color_mapper instanceof ScanningColorMapper)
      return new LinearInterpolationScale({binning: color_mapper.metrics.binning})
    else if (color_mapper instanceof CategoricalColorMapper)
      return new CategoricalScale()
    else
      unreachable()
  }

  override _create_ticker(): Ticker {
    const {color_mapper} = this.model

    if (color_mapper instanceof LogColorMapper)
      return new LogTicker()
    else if (color_mapper instanceof ScanningColorMapper)
      return new BinnedTicker({mapper: color_mapper})
    else if (color_mapper instanceof CategoricalColorMapper)
      return new CategoricalTicker()
    else
      return new BasicTicker()
  }

  override _get_major_size_factor(): number | null {
    return this.model.color_mapper.palette.length
  }

  override _paint_colors(ctx: Context2d, bbox: BBox): void {
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
}

export namespace ColorBar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseColorBar.Props & {
    color_mapper: p.Property<ColorMapper>
  }
}

export interface ColorBar extends ColorBar.Attrs {}

export class ColorBar extends BaseColorBar {
  override properties: ColorBar.Props
  override __view_type__: ColorBarView

  constructor(attrs?: Partial<ColorBar.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ColorBarView

    this.define<ColorBar.Props>(({Ref}) => ({
      color_mapper: [ Ref(ColorMapper) ],
    }))
  }
}
