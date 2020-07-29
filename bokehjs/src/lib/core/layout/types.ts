import {Align} from "../enums"
import {Enum} from "../kinds"

import {Size, Extents} from "../types"
export {Size}

const {min, max} = Math

export class Sizeable implements Size {
  width: number
  height: number

  constructor(size: Partial<Size> = {}) {
    this.width = size.width != null ? size.width : 0
    this.height = size.height != null ? size.height : 0
  }

  bounded_to({width, height}: Partial<Size>): Sizeable {
    return new Sizeable({
      width: this.width == Infinity && width != null ? width : this.width,
      height: this.height == Infinity && height != null ? height : this.height,
    })
  }

  expanded_to({width, height}: Size): Sizeable {
    return new Sizeable({
      width: width != Infinity ? max(this.width, width) : this.width,
      height: height != Infinity ? max(this.height, height) : this.height,
    })
  }

  expand_to({width, height}: Size): void {
    this.width = max(this.width, width)
    this.height = max(this.height, height)
  }

  narrowed_to({width, height}: Size): Sizeable {
    return new Sizeable({
      width: min(this.width, width),
      height: min(this.height, height),
    })
  }

  narrow_to({width, height}: Size): void {
    this.width = min(this.width, width)
    this.height = min(this.height, height)
  }

  grow_by({left, right, top, bottom}: Extents): Sizeable {
    const width = this.width + left + right
    const height = this.height + top + bottom
    return new Sizeable({width, height})
  }

  shrink_by({left, right, top, bottom}: Extents): Sizeable {
    const width = max(this.width - left - right, 0)
    const height = max(this.height - top - bottom, 0)
    return new Sizeable({width, height})
  }

  map(w_fn: (v: number) => number, h_fn?: (v: number) => number): Sizeable {
    return new Sizeable({
      width: w_fn(this.width),
      height: (h_fn != null ? h_fn : w_fn)(this.height),
    })
  }
}

export type Margin = Extents

export type SizeHint = Size & {inner?: Margin, align?: boolean}

export type SizingPolicy = "fixed" | "fit" | "min" | "max"
export const SizingPolicy = Enum("fixed", "fit", "min", "max")

export type Sizing = number | "fit" | "min" | "max"

export type BoxSizing = {
  width_policy: SizingPolicy
  min_width: number
  width?: number
  max_width: number

  height_policy: SizingPolicy
  min_height: number
  height?: number
  max_height: number

  aspect?: number
  margin: Margin
  visible: boolean
  halign: Align
  valign: Align
}
