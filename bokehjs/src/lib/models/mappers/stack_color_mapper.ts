import {ColorMapper, _convert_palette, _convert_color} from "./color_mapper"
import {ContinuousColorMapper} from "./continuous_color_mapper"
import * as p from "core/properties"
//import {Arrayable, Color} from "core/types"
import {Arrayable, ArrayableOf, uint32} from "core/types"
import {assert, unreachable} from "core/util/assert"
import {byte, decode_rgba, encode_rgba} from "core/util/color"

export namespace StackColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColorMapper.Props & {
      alpha_mapper: p.Property<ContinuousColorMapper>
  }
}

export interface StackColorMapper extends StackColorMapper.Attrs {}

export class StackColorMapper extends ColorMapper {
    override properties: StackColorMapper.Props

  constructor(attrs?: Partial<StackColorMapper.Attrs>) {
    super(attrs)
  }

  static {
    this.define<StackColorMapper.Props>(({Ref}) => {
      return {
        alpha_mapper: [ Ref(ContinuousColorMapper) ],
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

  // This could be in core/util/color.ts
  protected _mix_colors(colors_rgba: Array<uint32>, weights: Array<number>, divisor: number): uint32 {
    let r = 0.0, g = 0.0, b = 0.0, a = 0.0
    const n = weights.length
    for (let i = 0; i < n; i++) {
      const weight = weights[i] / divisor
      r += colors_rgba[i*4  ]*weight
      g += colors_rgba[i*4+1]*weight
      b += colors_rgba[i*4+2]*weight
      a += colors_rgba[i*4+3]*weight
    }
    return encode_rgba([byte(r), byte(g), byte(b), byte(a)])
  }

  protected override _v_compute_uint32(data: ArrayableOf<uint32>, values: Arrayable<uint32>,
      palette: Arrayable<uint32>, colors: {nan_color: uint32}): void {

    // If always receive 3D array then do not need the outside length_divisor????
    console.log("XXX SPECIAL _v_compute_uint32", data, values, palette, colors)

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

    // Needs to be NaNs not zeros...

    const {nan_color} = colors
    const total = new Array<number>(n).fill(0)  // Array of totals per pixel
    const weights = new Array<number>(ncolor)  // For single pixel

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < ncolor; j++) {
        const val = data[i*ncolor + j]
        total[i] += val
        weights[j] = val
      }

      if (total[i] == 0)
        values[i] = nan_color
      else {
        values[i] = this._mix_colors(palette_as_rgba, weights, total[i])
      }
    }

    // Need to apply alpha using totals...
  }
}
