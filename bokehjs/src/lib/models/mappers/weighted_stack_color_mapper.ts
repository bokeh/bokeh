import {_convert_palette, _convert_color} from "./color_mapper"
import {ContinuousColorMapper} from "./continuous_color_mapper"
import {StackColorMapper} from "./stack_color_mapper"
import type * as p from "core/properties"
import type {Arrayable, ArrayableOf, uint32} from "core/types"
import {RGBAArray} from "core/types"
import {min} from "core/util/arrayable"
import {assert, unreachable} from "core/util/assert"
import {byte, decode_rgba, encode_rgba} from "core/util/color"

export namespace WeightedStackColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = StackColorMapper.Props & {
    alpha_mapper: p.Property<ContinuousColorMapper>
    color_baseline: p.Property<number | null>
    stack_labels: p.Property<string[] | null>
  }
}

export interface WeightedStackColorMapper extends WeightedStackColorMapper.Attrs {}

export class WeightedStackColorMapper extends StackColorMapper {
  declare properties: WeightedStackColorMapper.Props

  constructor(attrs?: Partial<WeightedStackColorMapper.Attrs>) {
    super(attrs)
  }

  static {
    this.define<WeightedStackColorMapper.Props>(({List, Nullable, Float, Ref, Str}) => ({
      alpha_mapper:   [ Ref(ContinuousColorMapper) ],
      color_baseline: [ Nullable(Float), null ],
      stack_labels:   [ Nullable(List(Str)), null ],
    }))
  }

  // Weighted mix of colors.
  protected _mix_colors(colors_rgba: RGBAArray, nan_color: uint32, weights: Array<number>, total_weight: number): uint32 {
    if (isNaN(total_weight)) {
      return nan_color
    }

    let r = 0.0, g = 0.0, b = 0.0, a = 0.0
    const n = weights.length

    if (total_weight != 0) {
      for (let i = 0; i < n; i++) {
        if (isNaN(weights[i])) {
          continue
        }

        const weight = weights[i] / total_weight
        r += colors_rgba[i*4  ]*weight
        g += colors_rgba[i*4+1]*weight
        b += colors_rgba[i*4+2]*weight
        a += colors_rgba[i*4+3]*weight
      }
    } else {
      // Special case if total is zero then take mean color of all non-nan categories.
      let count = 0
      for (let i = 0; i < n; i++) {
        if (weights[i] == 0) {
          r += colors_rgba[i*4  ]
          g += colors_rgba[i*4+1]
          b += colors_rgba[i*4+2]
          a += colors_rgba[i*4+3]
          count++
        }
      }
      r /= count
      g /= count
      b /= count
      a /= count
    }
    return encode_rgba([byte(r), byte(g), byte(b), byte(a)])
  }

  protected override _v_compute<T>(_data: Arrayable<number>, _values: Arrayable<T>,
      _palette: Arrayable<T>, _colors: {nan_color: T}): void {
    unreachable()
  }

  protected override _v_compute_uint32(data: ArrayableOf<number>, values: Arrayable<uint32>,
      palette: Arrayable<uint32>, colors: {nan_color: uint32}): void {

    const n = values.length
    const ncolor = palette.length
    const nstack = data.length / n
    assert(nstack == ncolor, `Expected ${nstack} not ${ncolor} colors in palette`)

    // Color mixing is performed separately on each RGBA component, decode them just once
    const palette_as_rgba = new RGBAArray(ncolor*4)
    for (let i = 0; i < ncolor; i++) {
      const [r, g, b, a] = decode_rgba(palette[i])
      palette_as_rgba[i*4  ] = r
      palette_as_rgba[i*4+1] = g
      palette_as_rgba[i*4+2] = b
      palette_as_rgba[i*4+3] = a
    }

    // If color_baseline not specified, use nan-aware minimum of data.
    const color_baseline = this.color_baseline
    const baseline = color_baseline == null ? min(data) : color_baseline

    // Mix colors based on weights.
    const {nan_color} = colors
    const totals = new Array<number>(n)  // Array of totals per pixel
    const weights = new Array<number>(ncolor)  // For single pixel
    for (let i = 0; i < n; i++) {
      let total = NaN
      for (let icol = 0; icol < ncolor; icol++) {
        const index = i*ncolor + icol
        // If baseline non-zero, subtract it and clip to zero. Datashader only clips non-integers.
        const val = baseline == 0 ? data[index] : Math.max(data[index] - baseline, 0)
        weights[icol] = val
        if (!isNaN(val)) {
          if (isNaN(total)) {
            total = val
          } else {
            total += val
          }
        }
      }

      values[i] = this._mix_colors(palette_as_rgba, nan_color, weights, total)
      totals[i] = total + baseline*ncolor
    }

    // Calculate alphas using alpha_mapper.
    const alpha_palette = _convert_palette(this.alpha_mapper.palette)
    const alphas = new Uint32Array(n)
    this.alpha_mapper._v_compute(totals, alphas, alpha_palette, colors)

    // Combine RGBA and alphas.
    for (let i = 0; i < n; i++) {
      const alpha = byte((values[i] & 0xff)*(alphas[i] & 0xff) / 255.0)
      values[i] = (values[i] & 0xffffff00) | alpha
    }
  }
}
