import type {RendererView} from "../renderers/renderer"
import type {WindowAxis} from "core/enums"
import type {Rect} from "core/types"
import {Enum} from "../../core/kinds"

export const Dimensions = Enum("both", "x", "y", "none")
export type Dimensions = typeof Dimensions["__type__"]

export const auto_ranged = Symbol("auto_ranged")

export interface AutoRanged {
  readonly [auto_ranged]: true
  bounds_dimensions?(): Dimensions
  bounds(window_axis?: WindowAxis): Rect
  log_bounds?(): Rect
}

export function is_auto_ranged<T extends RendererView>(r: T): r is T & AutoRanged {
  return auto_ranged in r
}
