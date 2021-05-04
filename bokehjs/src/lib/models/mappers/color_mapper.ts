import {Mapper} from "./mapper"
import {Factor} from "../ranges/factor_range"
import * as p from "core/properties"
import {Signal0} from "core/signaling"
import {Arrayable, ArrayableOf, Color, uint32, ColorArray, RGBAArray} from "core/types"
import {color2rgba, encode_rgba} from "core/util/color"
import {to_big_endian} from "core/util/platform"

export interface RGBAMapper {
  v_compute(xs: Arrayable<number> | Arrayable<Factor>): RGBAArray
}

// export for testing
export function _convert_color(color: Color): uint32 {
  return encode_rgba(color2rgba(color))
}

// export for testing
export function _convert_palette(palette: Color[]): Uint32Array {
  const new_palette = new Uint32Array(palette.length)
  for (let i = 0, end = palette.length; i < end; i++)
    new_palette[i] = _convert_color(palette[i])
  return new_palette
}

export namespace ColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Mapper.Props & {
    palette: p.Property<Color[]>
    nan_color: p.Property<Color>
  }
}

export interface ColorMapper extends ColorMapper.Attrs {}

export abstract class ColorMapper extends Mapper<Color> {
  override properties: ColorMapper.Props

  metrics_change: Signal0<this>

  constructor(attrs?: Partial<ColorMapper.Attrs>) {
    super(attrs)
  }

  override initialize(): void {
    super.initialize()
    this.metrics_change = new Signal0(this, "metrics_change")
  }

  static init_ColorMapper(): void {
    this.define<ColorMapper.Props>(({Color, Array}) => ({
      palette:   [ Array(Color) ],
      nan_color: [ Color, "gray" ],
    }))
  }

  v_compute(xs: ArrayableOf<number | Factor>): Arrayable<Color> {
    const values: Color[] = new Array(xs.length)
    this._v_compute(xs, values, this.palette, this._colors((c) => c))
    return values
  }

  get rgba_mapper(): RGBAMapper {
    const self = this
    const palette = _convert_palette(this.palette)
    const colors = this._colors(_convert_color)
    return {
      v_compute(xs: ArrayableOf<uint32 | Factor>): RGBAArray {
        const values = new ColorArray(xs.length)
        self._v_compute(xs, values, palette, colors)
        return new Uint8ClampedArray(to_big_endian(values).buffer)
      },
    }
  }

  protected _colors<T>(conv: (c: Color) => T): {nan_color: T} {
    return {nan_color: conv(this.nan_color)}
  }

  protected abstract _v_compute<T>(xs: ArrayableOf<uint32 | Factor>, values: Arrayable<T>,
                                   palette: Arrayable<T>, colors: {nan_color: T}): void
}
