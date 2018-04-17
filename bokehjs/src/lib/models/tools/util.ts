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

  let result: DataRenderer[]
  if (renderers == 'auto') {
    result = all_renderers.filter((r): r is DataRenderer => {
      return r instanceof GlyphRenderer || r instanceof GraphRenderer
    })
  }
  else {
    result = renderers
  }

  if (names.length > 0) {
    result = result.filter((r) => includes(names, r.name))
  }

  return result
}

export function computed_renderers_by_data_source(computed_renderers: DataRenderer[]): {[key: string]: DataRenderer[]} {
  const renderers_by_source: {[key: string]: DataRenderer[]} = {}
  for (const r of computed_renderers) {
    let source_id: string
    if (r instanceof GraphRenderer)
      source_id = (r as any).node_renderer.data_source.id
    else
      source_id = (r as any).data_source.id

    if (!(source_id in renderers_by_source))
      renderers_by_source[source_id] = []

    renderers_by_source[source_id].push(r)
  }

  return renderers_by_source
}
