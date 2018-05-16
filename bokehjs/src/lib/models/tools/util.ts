import {includes} from "core/util/array"

import {Renderer} from "../renderers/renderer"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import {GraphRenderer} from "../renderers/graph_renderer"

export type DataRenderer = GlyphRenderer | GraphRenderer

export type RendererSpec = DataRenderer[] | "auto" | null

export function compute_renderers(renderers: RendererSpec, all_renderers: Renderer[], names: string[]): DataRenderer[] {
  if (renderers == null)
    return []

  let result: DataRenderer[]
  if (renderers == 'auto') {
    result = all_renderers.filter((r): r is DataRenderer => {
      return r instanceof GlyphRenderer || r instanceof GraphRenderer
    })
  } else
    result = renderers

  if (names.length > 0)
    result = result.filter((r) => includes(names, r.name))

  return result
}
