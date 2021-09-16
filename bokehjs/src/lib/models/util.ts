import {DataRenderer} from "./renderers/data_renderer"

export type RendererSpec = DataRenderer[] | "auto" | null

export function compute_renderers(renderers: RendererSpec, all_renderers: DataRenderer[]): DataRenderer[] {
  if (renderers == null)
    return []

  const result: DataRenderer[] = renderers == "auto" ? all_renderers : renderers

  return result
}
