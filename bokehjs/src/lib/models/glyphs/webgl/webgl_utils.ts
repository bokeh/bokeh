import {LineJoin} from "core/enums"
import {Uniform} from "core/uniforms"
import {color2rgba} from "core/util/color"
import {uint32} from "core/types"
import {HatchPattern} from "core/property_mixins"
import {hatch_aliases} from "core/visuals/patterns"

// WebGL shaders use integers for caps, joins and hatching.
export const cap_lookup = {butt: 0, round: 1, square: 2}

export const join_lookup = {miter: 0, round: 1, bevel: 2}

const hatch_pattern_lookup: {[key: string]: number} = {
  blank: 0,
  dot: 1,
  ring: 2,
  horizontal_line: 3,
  vertical_line: 4,
  cross: 5,
  horizontal_dash: 6,
  vertical_dash: 7,
  spiral: 8,
  right_diagonal_line: 9,
  left_diagonal_line: 10,
  diagonal_cross: 11,
  right_diagonal_dash: 12,
  left_diagonal_dash: 13,
  horizontal_wave: 14,
  vertical_wave: 15,
  criss_cross: 16,
}

function hatch_pattern_to_index(pattern: HatchPattern): number {
  return hatch_pattern_lookup[hatch_aliases[pattern] ?? pattern] ?? 0
}

export function color_to_uint8_array(color_prop: Uniform<uint32>, alpha_prop: Uniform<number>): Uint8Array {
  const ncolors = color_prop.is_Scalar() && alpha_prop.is_Scalar() ? 1 : color_prop.length
  const rgba = new Uint8Array(4*ncolors)

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
  if (prop == null)
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

export function hatch_pattern_prop_as_array(prop: Uniform<HatchPattern>): number[] | Float32Array {
  if (prop == null)
    return []
  else if (prop.is_Scalar())
    return [hatch_pattern_to_index(prop.value)]
  else {
    const array = new Float32Array(prop.length)
    for (let i = 0; i < prop.length; i++)
      array[i] = hatch_pattern_to_index(prop.get(i))
    return array
  }
}

export function line_join_prop_as_array(prop: Uniform<LineJoin>): number[] | Float32Array {
  if (prop == null)
    return []
  else if (prop.is_Scalar())
    return [join_lookup[prop.value]]
  else {
    const array = new Float32Array(prop.length)
    for (let i = 0; i < prop.length; i++)
      array[i] = join_lookup[prop.get(i)]
    return array
  }
}
