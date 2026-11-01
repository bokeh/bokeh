import {Mapper} from "./mapper"
import type {Factor} from "../ranges/factor_range"
import type * as p from "core/properties"
import {Signal0} from "core/signaling"
import type {Arrayable, Color, uint32, RGBAArray} from "core/types"
import {ColorArray} from "core/types"
import {color2rgba, encode_rgba} from "core/util/color"
import {to_big_endian} from "core/util/platform"
import type {NDArrayType} from "core/util/ndarray"
import {is_NDArray, Uint32NDArray} from "core/util/ndarray"

export interface RGBAMapper {
  v_compute(xs: Arrayable<number> | NDArrayType<number> | Arrayable<Factor> | NDArrayType<Factor>): RGBAArray
}

export function convert_to_uint32_color(color: Color): uint32 {
  return encode_rgba(color2rgba(color))
}

export function convert_to_uint32_palette(palette: Color[]): Uint32Array {
  const new_palette = new Uint32Array(palette.length)
  for (let i = 0, end = palette.length; i < end; i++) {
    new_palette[i] = convert_to_uint32_color(palette[i])
  }
  return new_palette
}

/**
 * Properties of the color mappers that map into a palette of their own:
 * `CategoricalColorMapper`, `ContinuousColorMapper` and `WeightedStackColorMapper`
 * each define these (they come from `PaletteMixin` on the Python side).
 */
export namespace PaletteMixin {
  export type Props = {
    palette: p.Property<Color[]>
    nan_color: p.Property<Color>
  }
}

export namespace ColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Mapper.Props
}

export interface ColorMapper extends ColorMapper.Attrs {}

export abstract class ColorMapper extends Mapper<Color> {
  declare properties: ColorMapper.Props

  readonly metrics_change: Signal0<this> = new Signal0(this, "metrics_change")

  /**
   * Emitted when `palette_mapper` is replaced by another mapper.
   */
  readonly palette_mapper_change: Signal0<this> = new Signal0(this, "palette_mapper_change")

  /**
   * The mapper whose palette and metrics represent this mapper, e.g. in a
   * `ColorBar`. It's this mapper, unless it delegates to another one, whose
   * `metrics_change` it then forwards.
   */
  get palette_mapper(): ColorMapper {
    return this
  }

  v_compute(xs: Arrayable<number> | Arrayable<Factor | number | null>): Arrayable<Color> {
    const values: ColorArray = new Uint32Array(xs.length)
    this._v_compute(xs, values, convert_to_uint32_palette(this._palette()), this._colors(convert_to_uint32_color))
    return new Uint32NDArray(values)
  }

  get rgba_mapper(): RGBAMapper {
    const self = this
    const palette = convert_to_uint32_palette(this._palette())
    const colors = this._colors(convert_to_uint32_color)
    return {
      v_compute(xs) {
        const length_divisor = is_NDArray(xs) && xs.dimension == 3 ? xs.shape[2] : 1
        const values = new ColorArray(xs.length / length_divisor)
        self._v_compute(xs, values, palette, colors)
        to_big_endian(values)
        return new Uint8ClampedArray(values.buffer)
      },
    }
  }

  /**
   * The palette `_v_compute()` maps into. `ColorMapper` has no palette of its
   * own, so subclasses either define one or take it from another mapper.
   */
  protected abstract _palette(): Color[]

  protected abstract _colors<T>(conv: (c: Color) => T): {nan_color: T}

  protected abstract _v_compute(xs: Arrayable<uint32> | Arrayable<Factor | number | null>,
    values: Arrayable<uint32>, palette: Arrayable<uint32>, colors: {nan_color: uint32}): void
}
