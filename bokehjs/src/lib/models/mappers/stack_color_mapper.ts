import {ColorMapper, _convert_palette, _convert_color} from "./color_mapper"
import {ContinuousColorMapper} from "./continuous_color_mapper"
import * as p from "core/properties"
//import {Arrayable, Color} from "core/types"
import {Arrayable} from "core/types"
import {assert} from "core/util/assert"
//import {color2rgba} from "core/util/color"
//import {decode_rgba} from "core/util/color"

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

  protected _v_compute<T>(data: Arrayable<number>, values: Arrayable<T>,
      palette: Arrayable<T>, colors: {nan_color: T, low_color?: T, high_color?: T}): void {

    console.log("StackColorMapper._v_compute", this.alpha_mapper, data, values)
    console.log("  palette", palette)

    // This is where we mix the colors based on the data, so set values from data.
    // The problem is that the values is 3D not 2D!!!!!!!

    const n = values.length

    const nstack = data.length / n
    const ncolor = palette.length
    assert(nstack == ncolor, `Expected ${nstack} not ${ncolor} colors in palette`)

    // Walk through array one entry at a time and mix colors...  Could be NaN of course.
    // May want to cache the total array in image_stack???
    //const total = new Array<number>(n).fill(NaN)
    const total = new Array<number>(n).fill(0)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < nstack; j++) {
        total[i] += data[i*nstack + j]
      }
    }

    /*for (let i = 0; i < data.length; i++) {
      const j = i % ncolor
      //if (!isNaN(total[j]) && !isNaN(data[i]))
      total[j] += data[i]
      //else if (isNaN(total[j]))
      //  total[j] = data[i]
    }*/

    // Palette is a Uint32Array
    console.log("color0", palette[0])  // Want RGBA???
    console.log("color1", palette[1])

    //const tp = typeof colors.nan_color
    console.log("XXX", typeof palette[0], typeof colors.nan_color)
    if (palette instanceof Float32Array) {
      console.log("==> Float32Array")
    } else {
      console.log("==> other type!")
    }

    const {nan_color} = colors
    console.log("total", total)  // Total is needed for correct alpha-scaling.

    //const stack_data = new Array<number>(nstack)

    for (let i = 0; i < n; i++) {
      if (total[i] == 0)  // if (isNaN(total[i]))
        values[i] = nan_color
      else {
        //for (let j = 0; j < nstack; j++) {
        //  const d = data[
        //}
        if (data[i*nstack] > data[i*nstack + 1])
          values[i] = palette[0]
        else
          values[i] = palette[1]
      }
    }
  }
}
