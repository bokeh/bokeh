import {ColorMapper, _convert_palette, _convert_color} from "./color_mapper"
import {ContinuousColorMapper} from "./continuous_color_mapper"
import * as p from "core/properties"
import {Arrayable, ArrayableOf, uint32} from "core/types"
import {min} from "core/util/arrayable"
import {assert, unreachable} from "core/util/assert"
import {byte, decode_rgba, encode_rgba} from "core/util/color"

export namespace StackColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColorMapper.Props & {
      alpha_mapper: p.Property<ContinuousColorMapper>
      color_baseline: p.Property<number | null>
  }
}

export interface StackColorMapper extends StackColorMapper.Attrs {}

export class StackColorMapper extends ColorMapper {
    override properties: StackColorMapper.Props

  constructor(attrs?: Partial<StackColorMapper.Attrs>) {
    super(attrs)
  }

  static {
    this.define<StackColorMapper.Props>(({Nullable, Number, Ref}) => {
      return {
        alpha_mapper:   [ Ref(ContinuousColorMapper) ],
        color_baseline: [ Nullable(Number), null ],
      }
    })
  }

  override connect_signals(): void {
    super.connect_signals()


  }

  protected override _v_compute<T>(_data: Arrayable<number>, _values: Arrayable<T>,
      _palette: Arrayable<T>, _colors: {nan_color: T}): void {
    unreachable()
  }

  // Weighted mix of colors.
  // This could be in core/util/color.ts
  protected _mix_colors(colors_rgba: Array<uint32>, nan_color: uint32, weights: Array<number>, total_weight: number): uint32 {
    if (isNaN(total_weight))
      return nan_color

    let r = 0.0, g = 0.0, b = 0.0, a = 0.0
    const n = weights.length
    for (let i = 0; i < n; i++) {
      if (isNaN(weights[i]))
        continue

      const weight = weights[i] / total_weight
      r += colors_rgba[i*4  ]*weight
      g += colors_rgba[i*4+1]*weight
      b += colors_rgba[i*4+2]*weight
      a += colors_rgba[i*4+3]*weight
    }
    return encode_rgba([byte(r), byte(g), byte(b), byte(a)])
  }

  protected override _v_compute_uint32(data: ArrayableOf<number>, values: Arrayable<uint32>,
      palette: Arrayable<uint32>, colors: {nan_color: uint32}): void {

    // If always receive 3D array then do not need the outside length_divisor????

    const n = values.length  // Number of pixels/elements
    const ncolor = palette.length
    const nstack = data.length / n
    assert(nstack == ncolor, `Expected ${nstack} not ${ncolor} colors in palette`)

    // Color mixing is performed separately on each RGBA component, decode them just once
    const palette_as_rgba = new Array<uint32>(ncolor*4)
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
    if (baseline != 0) {
      for (let i = 0, length = data.length; i < length; i++) {
        // Subtract baseline and clip to zero. Datashader only clips non-integers.
        data[i] = Math.max(data[i] - baseline, 0)
      }
    }

    // Mix colors based on weights.
    const {nan_color} = colors
    const totals = new Array<number>(n)  // Array of totals per pixel
    const weights = new Array<number>(ncolor)  // For single pixel
    for (let i = 0; i < n; i++) {
      let total = NaN
      for (let icol = 0; icol < ncolor; icol++) {
        const val = data[i*ncolor + icol]
        weights[icol] = val
        if (!isNaN(val)) {
          if (isNaN(total))
            total = val
          else
            total += val
        }
      }

      values[i] = this._mix_colors(palette_as_rgba, nan_color, weights, total)
      totals[i] = total
    }

    // Calculate alphas using alpha_mapper.
    const alpha_palette = _convert_palette(this.alpha_mapper.palette)
    const alphas = new Uint32Array(n)
    this.alpha_mapper._v_compute(totals, alphas, alpha_palette, colors)

    // Combine RGBA and alphas.
    for (let i = 0; i < n; i++) {
      // Combining two bytes here, maybe losing too much precision?
      // Should be in separate function in core/util/color.ts
      const alpha = byte((values[i] & 0xff)*(alphas[i] & 0xff) / 255.0)
      values[i] = (values[i] & 0xffffff00) | alpha

      //const [r, g, b, a] = decode_rgba(values[i])
      //console.log(i, r, g, b, a)
    }
  }
}
