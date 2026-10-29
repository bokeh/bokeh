import type {RendererView} from "../renderers/renderer"
import type {AutoRanging, WindowAxis} from "core/enums"
import type {Rect} from "core/types"

export const auto_ranged = Symbol("auto_ranged")

export interface AutoRanged {
  readonly [auto_ranged]: true
  bounds_dimensions?(): AutoRanging
  bounds(window_axis?: WindowAxis): Rect
  log_bounds?(): Rect
}

export function is_auto_ranged<T extends RendererView>(r: T): r is T & AutoRanged {
  return auto_ranged in r
}
