import {HatchPattern} from "core/property_mixins"
import {hatch_aliases} from "core/visuals/patterns"
import {MarkerType} from "core/enums"

// WebGL shaders use integers for caps, joins and hatching.
export const cap_lookup = {butt: 0, round: 1, square: 2}

export const join_lookup = {miter: 0, round: 1, bevel: 2}

const hatch_pattern_lookup: {[key: string]: number | undefined} = {
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

export function hatch_pattern_to_index(pattern: HatchPattern): number {
  return hatch_pattern_lookup[hatch_aliases[pattern] ?? pattern] ?? 0
}

export function marker_type_to_size_hint(marker_type: MarkerType): number {
  // Marker size hint is only used here and in the marker fragment shader.
  switch (marker_type) {
    case "dash":
      return 1
    case "dot":
      return 2
    case "diamond":
    case "diamond_cross":
    case "diamond_dot":
      return 3
    case "hex":
      return 4
    case "square_pin":
      return 5
    case "inverted_triangle":
    case "triangle":
    case "triangle_dot":
      return 6
    case "triangle_pin":
      return 7
    case "star":
    case "star_dot":
      return 8
    default:
      return 0
  }
}
