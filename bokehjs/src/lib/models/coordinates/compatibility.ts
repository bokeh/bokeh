import type {CoordinateMapping} from "./coordinate_mapping"
import {PolarMapping} from "./polar_mapping"
import type {Glyph} from "../glyphs/glyph"
import {Scatter} from "../glyphs/scatter"

export function glyph_coordinate_error(glyph: Glyph, mapping: CoordinateMapping | null): string | null {
  // Figure methods check the glyph prototype before constructing the model.
  if (mapping instanceof PolarMapping && !(glyph instanceof Scatter || glyph == Scatter.prototype)) {
    return `${glyph.type} is not supported by PolarMapping`
  }
  return null
}

export function renderer_coordinate_error(mapping: CoordinateMapping | null, glyphs: readonly Glyph[] | null): string | null {
  if (mapping instanceof PolarMapping && (glyphs == null || glyphs.some((glyph) => glyph_coordinate_error(glyph, mapping) != null))) {
    return "this renderer or its visual-state glyphs are not supported by PolarMapping"
  }
  return null
}
