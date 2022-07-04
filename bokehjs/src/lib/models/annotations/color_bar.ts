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
import {Arrayable} from "core/types"
import {range, reversed} from "core/util/array"
import {unreachable} from "core/util/assert"
import {BBox} from "core/util/bbox"
import {Context2d} from "core/util/canvas"

export class ColorBarView extends BaseColorBarView {
  override model: ColorBar
  override layout: Layoutable

  protected _image: HTMLCanvasElement | null

  // Indices of displayed colors corresponding to low and high cutoffs.
  protected _low_index: number | null
  protected _high_index: number | null

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.color_mapper.change, async () => {
      this._title_view.remove()
      this._axis_view.remove()
      this.initialize()
      await this.lazy_initialize()
      this.plot_view.invalidate_layout()
    })
    this.connect(this.model.color_mapper.metrics_change, () => this._metrics_changed())
    this.connect(this.model.properties.low_cutoff.change, () => this._metrics_changed())
    this.connect(this.model.properties.high_cutoff.change, () => this._metrics_changed())
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
    else if (color_mapper instanceof ContinuousColorMapper) {
      const {min, max} = this._continuous_metrics(color_mapper)
      return new Range1d({start: min, end: max})
    } else
      unreachable()
  }

  override _create_major_scale(): Scale {
    const {color_mapper} = this.model

    if (color_mapper instanceof LinearColorMapper)
      return new LinearScale()
    else if (color_mapper instanceof LogColorMapper)
      return new LogScale()
    else if (color_mapper instanceof ScanningColorMapper)
      return new LinearInterpolationScale({binning: this._scanning_binning(color_mapper)})
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

  // Return min and max metrics of ContinuousColorMapper, modified to account for low and high cutoffs.
  protected _continuous_metrics(color_mapper: ContinuousColorMapper): {min: number, max: number} {
    const {low_cutoff, high_cutoff} = this.model
    let {min, max} = color_mapper.metrics

    if (high_cutoff != null && low_cutoff != null && high_cutoff < low_cutoff) {
      // Empty color bar.
      this._low_index = 0
      this._high_index = -1
      return {min: NaN, max: NaN}
    }

    this._high_index = null
    if (high_cutoff != null) {
      const palette_length = color_mapper.palette.length
      const high_index = color_mapper.value_to_index(high_cutoff, palette_length)
      if (high_index < palette_length-1) {
        this._high_index = high_index
        max = color_mapper.index_to_value(high_index+1)
      }
    }

    this._low_index = null
    if (low_cutoff != null) {
      const low_index = color_mapper.value_to_index(low_cutoff, color_mapper.palette.length)
      if (low_index > 0) {
        this._low_index = low_index
        min = color_mapper.index_to_value(low_index)
      }
    }

    return {min, max}
  }

  override _get_major_size_factor(): number | null {
    return this.model.color_mapper.palette.length
  }

  protected _metrics_changed(): void {
    const range = this._major_range
    const scale = this._major_scale

    const {color_mapper} = this.model

    if (color_mapper instanceof ScanningColorMapper && scale instanceof LinearInterpolationScale) {
      const binning = this._scanning_binning(color_mapper)
      scale.binning = binning

      // Update the frame's LinearInterpolationScale and Range1d as they are
      // different objects to this._major_scale and this._major_range.
      const frame_y_scale = this._frame.y_scale
      if (frame_y_scale instanceof LinearInterpolationScale) {
        frame_y_scale.binning = binning

        const frame_y_range = this._frame.y_range
        if (frame_y_range instanceof Range1d) {
          frame_y_range.start = binning[0]
          frame_y_range.end = binning[binning.length-1]
        }
      }
    } else if (color_mapper instanceof ContinuousColorMapper && range instanceof Range1d) {
      const {min, max} = this._continuous_metrics(color_mapper)
      range.setv({start: min, end: max})
    }

    this._set_canvas_image()
    this.plot_view.request_layout() // this.request_render()
  }

  override _paint_colors(ctx: Context2d, bbox: BBox): void {
    const {x, y, width, height} = bbox
    ctx.save()
    ctx.globalAlpha = this.model.scale_alpha
    if (this._image != null) {
      ctx.setImageSmoothingEnabled(false)
      ctx.drawImage(this._image, x, y, width, height)
    }
    if (this.visuals.bar_line.doit) {
      this.visuals.bar_line.set_value(ctx)
      ctx.strokeRect(x, y, width, height)
    }
    ctx.restore()
  }

  // Return binning array of ScanningColorMapper, modified to account for low and high cutoffs.
  protected _scanning_binning(color_mapper: ScanningColorMapper): Arrayable<number> {
    let {binning} = color_mapper.metrics
    const {low_cutoff, high_cutoff} = this.model

    if (high_cutoff != null && low_cutoff != null && high_cutoff < low_cutoff) {
      // Empty color bar.
      this._low_index = 0
      this._high_index = -1
      return [NaN]
    }

    this._high_index = null
    if (high_cutoff != null) {
      const high_index = color_mapper.value_to_index(high_cutoff, binning.length)
      if (high_index < binning.length-1)
        this._high_index = high_index
    }

    this._low_index = null
    if (low_cutoff != null) {
      const low_index = color_mapper.value_to_index(low_cutoff, binning.length)
      if (low_index > 0) {
        this._low_index = low_index
      }
    }

    if (this._low_index != null || this._high_index != null) {
      // Slice binning array.
      const start = this._low_index != null ? this._low_index : 0
      const end = this._high_index != null ? this._high_index + 1 : binning.length - 1
      const n = end - start + 1
      if (n > 0) {
        const new_binning = new Array<number>(n)
        for (let i = 0; i < n; i++)
          new_binning[i] = binning[i + start]
        binning = new_binning
      } else
        binning = [NaN]
    }

    return binning
  }

  protected _set_canvas_image(): void {
    const {orientation} = this

    let {palette} = this.model.color_mapper

    if (this._high_index != null || this._low_index != null) {
      palette = palette.slice(
        this._low_index != null ? this._low_index : 0,
        this._high_index != null ? this._high_index + 1 : palette.length)
    }

    if (palette.length < 1) {
      // Early exit for empty color bar.
      this._image = null
      return
    }

    if (orientation == "vertical")
      palette = reversed(palette)

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
    low_cutoff: p.Property<number | null>
    high_cutoff: p.Property<number | null>
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

    this.define<ColorBar.Props>(({Nullable, Number, Ref}) => ({
      color_mapper: [ Ref(ColorMapper) ],
      low_cutoff:   [ Nullable(Number), null ],
      high_cutoff:  [ Nullable(Number), null ],
    }))
  }
}
