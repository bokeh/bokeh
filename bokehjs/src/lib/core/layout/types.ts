import {Size, Extents} from "../types"
export {Size}

const {min, max} = Math

export class Sizeable implements Size {
  width: number
  height: number

  constructor(size?: Partial<Size>) {
    this.width = size != null && size.width != null ? size.width : 0
    this.height = size != null && size.height != null ? size.height : 0
  }

  bounded_to({width, height}: Partial<Size>): Sizeable {
    return new Sizeable({
      width: this.width == Infinity && width != null ? width : this.width,
      height: this.height == Infinity && height != null ? height : this.height,
    })
  }

  expandend_to({width, height}: Size): Sizeable {
    return new Sizeable({
      width: max(this.width, width),
      height: max(this.height, height),
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

  map(fn: (v: number) => number): Sizeable {
    return new Sizeable({width: fn(this.width), height: fn(this.height)})
  }
}

export type Margin = Extents

export type SizeHint = Size & {inner?: Margin}

export type SizingPolicy = "fixed" | "fit" | "min" | "max"

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
}
