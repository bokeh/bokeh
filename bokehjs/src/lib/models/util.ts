import {Renderer} from "./renderers/renderer"

export function compute_renderers<T extends Renderer>(renderers: T[] | "auto" | null, all_renderers: T[]): T[] {
  return renderers == "auto" ? all_renderers : renderers ?? []
}
