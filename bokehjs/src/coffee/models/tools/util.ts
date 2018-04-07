import {Renderer} from "../renderers/renderer"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import {GraphRenderer} from "../renderers/graph_renderer"

import {includes} from "core/util/array"

export type DataRenderer = GlyphRenderer | GraphRenderer

export type RendererSpec = DataRenderer[] | "auto" | null

export function compute_renderers(renderers: RendererSpec, all_renderers: Renderer[], names: string[]): DataRenderer[] {
    if (renderers == null) {
      return []
    }

    if (renderers.length == 0) {
      return []
    }

    let result = renderers as DataRenderer[]

    if (renderers == 'auto') {
      result = all_renderers.filter((r): r is DataRenderer => {
        return r instanceof GlyphRenderer || r instanceof GraphRenderer
      })
    }

    if (names.length > 0)
      result = result.filter((r) => includes(names, r.name))

    return result

  }
