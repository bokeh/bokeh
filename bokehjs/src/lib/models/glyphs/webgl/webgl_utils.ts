import {Uniform} from "core/uniforms"
import {color2rgba} from "core/util/color"
import {uint32} from "core/types"

export function color_to_uint8_array(color_prop: Uniform<uint32>, alpha_prop: Uniform<number>): Uint8Array {
  const ncolors: number = Math.max(color_prop.length, alpha_prop.length)
  const rgba: Uint8Array = new Uint8Array(4*ncolors)

  for (let i = 0; i < ncolors; i++) {
    const [r, g, b, a] = color2rgba(color_prop.get(i), alpha_prop.get(i))
    rgba[4*i  ] = r
    rgba[4*i+1] = g
    rgba[4*i+2] = b
    rgba[4*i+3] = a
  }
  return rgba
}

export function prop_as_array(prop: Uniform<number>): number[] | Float32Array {
  if (prop === undefined)
    return []
  else if (prop.is_Scalar())
    return [prop.value]
  else {
    const array = new Float32Array(prop.length)
    for (let i = 0; i < prop.length; i++)
      array[i] = prop.get(i)
    return array
  }
}
