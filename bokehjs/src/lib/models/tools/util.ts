import {DataRenderer} from "../renderers/data_renderer"
import {includes} from "core/util/array"

export type RendererSpec = DataRenderer[] | "auto" | null

export function compute_renderers(renderers: RendererSpec, all_renderers: DataRenderer[], names: string[]): DataRenderer[] {
  if (renderers == null)
    return []

  let result: DataRenderer[] = renderers == 'auto' ?  all_renderers : renderers

  if (names.length > 0)
    result = result.filter((r) => includes(names, r.name))

  return result
}
