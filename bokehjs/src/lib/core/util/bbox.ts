import type {Arrayable, Rect, Box, Interval, Size} from "../types"
import {ScreenArray} from "../types"
import type {VAlign, HAlign} from "../enums"
import type {Equatable, Comparator} from "./eq"
import {equals} from "./eq"
import type * as affine from "./affine"
import {map} from "./arrayable"
import {isPlainObject} from "./types"

const {min, max, round} = Math

export function empty(): Rect {
  return {
    x0:  Infinity,
    y0:  Infinity,
    x1: -Infinity,
    y1: -Infinity,
  }
}

export function positive_x(): Rect {
  return {
    x0:  Number.MIN_VALUE,
    y0: -Infinity,
    x1:  Infinity,
    y1:  Infinity,
  }
}

export function positive_y(): Rect {
  return {
    x0: -Infinity,
    y0:  Number.MIN_VALUE,
    x1:  Infinity,
    y1:  Infinity,
  }
}

function _min(a: number, b: number): number {
  if (isNaN(a)) {
    return b
  } else if (isNaN(b)) {
    return a
  } else {
    return min(a, b)
  }
}

function _max(a: number, b: number): number {
  if (isNaN(a)) {
    return b
  } else if (isNaN(b)) {
    return a
  } else {
    return max(a, b)
  }
}

export function union(a: Rect, b: Rect): Rect {
  return {
    x0: _min(a.x0, b.x0),
    x1: _max(a.x1, b.x1),
    y0: _min(a.y0, b.y0),
    y1: _max(a.y1, b.y1),
  }
}

export type XY<T = number> = {
  x: T
  y: T
}

export function isXY<T>(obj: unknown): obj is XY<T> {
  return isPlainObject(obj) && "x" in obj && "y" in obj
}

export type SXY = {
  sx: number
  sy: number
}

export type LRTB<T = number> = {
  left: T
  right: T
  top: T
  bottom: T
}

export type Corners<T = number> = {
  top_left: T
  top_right: T
  bottom_right: T
  bottom_left: T
}

export type HorizontalPosition =
  {left: number,    width: number} |
  {width: number,   right: number} |
  {left: number,    right: number} |
  {hcenter: number, width: number}
export type VerticalPosition =
  {top: number,     height: number} |
  {height: number,  bottom: number} |
  {top: number,     bottom: number} |
  {vcenter: number, height: number}

export type Position = HorizontalPosition & VerticalPosition

export type CoordinateMapper = {
  compute(v: number): number
  invert(sv: number): number
  v_compute(vs: Arrayable<number>): ScreenArray
  v_invert(svs: Arrayable<number>): Arrayable<number>
  readonly source_range: Interval
  readonly target_range: Interval
}

export class BBox implements Rect, Equatable {
  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number

  constructor(box?: Rect | Box | Position, correct: boolean = false) {
    if (box == null) {
      this.x0 = 0
      this.y0 = 0
      this.x1 = 0
      this.y1 = 0
    } else if ("x0" in box) {
      const {x0, y0, x1, y1} = box
      if (!isFinite(x0 + y0 + x1 + y1)) {
        this.x0 = NaN
        this.y0 = NaN
        this.x1 = NaN
        this.y1 = NaN
      } else {
        if (!(x0 <= x1 && y0 <= y1)) {
          throw new Error(`invalid bbox {x0: ${x0}, y0: ${y0}, x1: ${x1}, y1: ${y1}}`)
        }
        this.x0 = x0
        this.y0 = y0
        this.x1 = x1
        this.y1 = y1
      }
    } else if ("x" in box) {
      const {x, y, width, height, origin="top_left"} = box
      if (!(width >= 0 && height >= 0)) {
        throw new Error(`invalid bbox {x: ${x}, y: ${y}, width: ${width}, height: ${height}}`)
      }
      const base_origin = (() => {
        switch (origin) {
          case "left":   return "center_left"
          case "right":  return "center_right"
          case "top":    return "top_center"
          case "bottom": return "bottom_center"
          case "center": return "center_center"
          default:       return origin
        }
      })()
      const [y_align, x_align] = base_origin.split("_", 2) as [VAlign, HAlign]
      const y_coeff = (() => {
        switch (y_align) {
          case "top":    return 0.0
          case "center": return 0.5
          case "bottom": return 1.0
        }
      })()
      const x_coeff = (() => {
        switch (x_align) {
          case "left":   return 0.0
          case "center": return 0.5
          case "right":  return 1.0
        }
      })()
      const d_width = x_coeff*width
      const d_height = y_coeff*height
      const x0 = x - d_width
      const y0 = y - d_height
      const x1 = x0 + width
      const y1 = y0 + height
      this.x0 = x0
      this.y0 = y0
      this.x1 = x1
      this.y1 = y1
    } else {
      let left: number, right: number
      let top: number, bottom: number

      if ("width" in box) {
        if ("left" in box) {
          left = box.left
          right = left + box.width
        } else if ("right" in box) {
          right = box.right
          left = right - box.width
        } else {
          const w2 = box.width/2
          left = box.hcenter - w2
          right = box.hcenter + w2
        }
      } else {
        left = box.left
        right = box.right
      }

      if ("height" in box) {
        if ("top" in box) {
          top = box.top
          bottom = top + box.height
        } else if ("bottom" in box) {
          bottom = box.bottom
          top = bottom - box.height
        } else {
          const h2 = box.height/2
          top = box.vcenter - h2
          bottom = box.vcenter + h2
        }
      } else {
        top = box.top
        bottom = box.bottom
      }

      if (left > right || top > bottom) {
        if (correct) {
          if (left > right) {
            left = right
          }
          if (top > bottom) {
            top = bottom
          }
        } else {
          throw new Error(`invalid bbox {left: ${left}, top: ${top}, right: ${right}, bottom: ${bottom}}`)
        }
      }

      this.x0 = left
      this.y0 = top
      this.x1 = right
      this.y1 = bottom
    }
  }

  static from_lrtb({left, right, top, bottom}: LRTB): BBox {
    return new BBox({
      x0: min(left, right),
      y0: min(top, bottom),
      x1: max(left, right),
      y1: max(top, bottom),
    })
  }

  static from_rect({x0, y0, x1, y1}: Rect): BBox {
    return new BBox({
      x0: min(x0, x1),
      y0: min(y0, y1),
      x1: max(x0, x1),
      y1: max(y0, y1),
    })
  }

  static empty(): BBox {
    return new BBox({x0: 0, y0: 0, x1: 0, y1: 0})
  }

  static invalid(): BBox {
    return new BBox({x0: NaN, y0: NaN, x1: NaN, y1: NaN})
  }

  clone(): BBox {
    return new BBox(this)
  }

  equals(that: Rect): boolean {
    return this.x0 == that.x0 && this.y0 == that.y0 &&
           this.x1 == that.x1 && this.y1 == that.y1
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.x0, that.x0) && cmp.eq(this.y0, that.y0) &&
           cmp.eq(this.x1, that.x1) && cmp.eq(this.y1, that.y1)
  }

  toString(): string {
    return `BBox({left: ${this.left}, top: ${this.top}, width: ${this.width}, height: ${this.height}})`
  }

  get is_valid(): boolean {
    const {x0, x1, y0, y1} = this
    return isFinite(x0 + x1 + y0 + y1)
  }

  get is_empty(): boolean {
    const {x0, x1, y0, y1} = this
    return x0 == 0 && x1 == 0 && y0 == 0 && y1 == 0
  }

  get left(): number {
    return this.x0
  }
  get top(): number {
    return this.y0
  }
  get right(): number {
    return this.x1
  }
  get bottom(): number {
    return this.y1
  }

  get p0(): XY<number> {
    return {x: this.x0, y: this.y0}
  }
  get p1(): XY<number> {
    return {x: this.x1, y: this.y1}
  }

  get x(): number {
    return this.x0
  }
  get y(): number {
    return this.y0
  }
  get width(): number {
    return this.x1 - this.x0
  }
  get height(): number {
    return this.y1 - this.y0
  }

  get size(): Size {
    return {width: this.width, height: this.height}
  }

  get rect(): affine.Rect {
    const {x0, y0, x1, y1} = this
    return {
      p0: {x: x0, y: y0},
      p1: {x: x1, y: y0},
      p2: {x: x1, y: y1},
      p3: {x: x0, y: y1},
    }
  }

  get box(): Box {
    const {x, y, width, height} = this
    return {x, y, width, height}
  }

  get lrtb(): LRTB {
    const {left, right, top, bottom} = this
    return {left, right, top, bottom}
  }

  get args(): [x: number, y: number, w: number, h: number] {
    const {x, y, width, height} = this
    return [x, y, width, height]
  }

  get x_range(): Interval {
    return {start: this.x0, end: this.x1}
  }
  get y_range(): Interval {
    return {start: this.y0, end: this.y1}
  }

  get h_range(): Interval {
    return this.x_range
  }
  get v_range(): Interval {
    return this.y_range
  }

  get ranges(): [Interval, Interval] {
    return [this.x_range, this.y_range]
  }

  get aspect(): number {
    return this.width/this.height
  }

  get x_center(): number {
    return (this.left + this.right)/2
  }
  get y_center(): number {
    return (this.top + this.bottom)/2
  }

  get hcenter(): number {
    return this.x_center
  }
  get vcenter(): number {
    return this.y_center
  }

  get area(): number {
    return this.width*this.height
  }

  resolve(symbol: string): XY | number {
    switch (symbol) {
      case "top_left":      return this.top_left
      case "top_center":    return this.top_center
      case "top_right":     return this.top_right

      case "center_left":   return this.center_left
      case "center_center": return this.center_center
      case "center_right":  return this.center_right

      case "bottom_left":   return this.bottom_left
      case "bottom_center": return this.bottom_center
      case "bottom_right":  return this.bottom_right

      case "center":        return this.center

      case "top":           return this.top
      case "left":          return this.left
      case "right":         return this.right
      case "bottom":        return this.bottom

      case "width":         return this.width
      case "height":        return this.height

      default:              return {x: NaN, y: NaN}
    }
  }

  get top_left(): XY {
    return {x: this.left, y: this.top}
  }
  get top_center(): XY {
    return {x: this.hcenter, y: this.top}
  }
  get top_right(): XY {
    return {x: this.right, y: this.top}
  }

  get center_left(): XY {
    return {x: this.left, y: this.vcenter}
  }
  get center_center(): XY {
    return {x: this.hcenter, y: this.vcenter}
  }
  get center_right(): XY {
    return {x: this.right, y: this.vcenter}
  }

  get bottom_left(): XY {
    return {x: this.left, y: this.bottom}
  }
  get bottom_center(): XY {
    return {x: this.hcenter, y: this.bottom}
  }
  get bottom_right(): XY {
    return {x: this.right, y: this.bottom}
  }

  get center(): XY {
    return {x: this.hcenter, y: this.vcenter}
  }

  round(): BBox {
    return new BBox({
      x0: round(this.x0),
      x1: round(this.x1),
      y0: round(this.y0),
      y1: round(this.y1),
    })
  }

  relative(): BBox {
    const {width, height} = this
    return new BBox({x: 0, y: 0, width, height})
  }

  relative_to(to: BBox): BBox {
    const {x, y, width, height} = this
    return new BBox({x: x - to.x, y: y - to.y, width, height})
  }

  translate(tx: number, ty: number): BBox {
    const {x, y, width, height} = this
    return new BBox({x: tx + x, y: ty + y, width, height})
  }

  scale(factor: number): BBox {
    return new BBox({
      x0: this.x0*factor,
      x1: this.x1*factor,
      y0: this.y0*factor,
      y1: this.y1*factor,
    })
  }

  relativize(x: number, y: number): [number, number] {
    return [x - this.x, y - this.y]
  }

  contains(x: number, y: number): boolean {
    return this.x0 <= x && x <= this.x1 && this.y0 <= y && y <= this.y1
  }

  clip(x: number, y: number): [number, number] {
    if (x < this.x0) {
      x = this.x0
    } else if (x > this.x1) {
      x = this.x1
    }

    if (y < this.y0) {
      y = this.y0
    } else if (y > this.y1) {
      y = this.y1
    }

    return [x, y]
  }

  grow_by(size: number): BBox {
    return new BBox({
      left: this.left - size,
      right: this.right + size,
      top: this.top - size,
      bottom: this.bottom + size,
    })
  }

  shrink_by(size: number): BBox {
    return new BBox({
      left: this.left + size,
      right: this.right - size,
      top: this.top + size,
      bottom: this.bottom - size,
    }, true)
  }

  union(that: Rect): BBox {
    return new BBox({
      x0: min(this.x0, that.x0),
      y0: min(this.y0, that.y0),
      x1: max(this.x1, that.x1),
      y1: max(this.y1, that.y1),
    })
  }

  intersection(that: Rect): BBox | null {
    if (!this.intersects(that)) {
      return null
    } else {
      return new BBox({
        x0: max(this.x0, that.x0),
        y0: max(this.y0, that.y0),
        x1: min(this.x1, that.x1),
        y1: min(this.y1, that.y1),
      })
    }
  }

  intersects(that: Rect): boolean {
    return !(that.x1 < this.x0 || that.x0 > this.x1 ||
             that.y1 < this.y0 || that.y0 > this.y1)
  }

  private _x_percent?: CoordinateMapper
  get x_percent(): CoordinateMapper {
    const self = this
    return this._x_percent ?? (this._x_percent = {
      compute(x: number): number {
        return self.left + x*self.width
      },
      invert(sx: number): number {
        return (sx - self.left)/self.width
      },
      v_compute(xs: Arrayable<number>): ScreenArray {
        const {left, width} = self
        return new ScreenArray(map(xs, (x) => left + x*width))
      },
      v_invert(sxs: Arrayable<number>): Arrayable<number> {
        const {left, width} = self
        return map(sxs, (sx) => (sx - left)/width)
      },
      get source_range(): Interval {
        return self.x_range
      },
      get target_range(): Interval {
        return self.x_range
      },
    })
  }

  private _y_percent?: CoordinateMapper
  get y_percent(): CoordinateMapper {
    const self = this
    return this._y_percent ?? (this._y_percent = {
      compute(y: number): number {
        return self.top + y*self.height
      },
      invert(sy: number): number {
        return (sy - self.top)/self.height
      },
      v_compute(ys: Arrayable<number>): ScreenArray {
        const {top, height} = self
        return new ScreenArray(map(ys, (y) => top + y*height))
      },
      v_invert(sys: Arrayable<number>): Arrayable<number> {
        const {top, height} = self
        return map(sys, (sy) => (sy - top)/height)
      },
      get source_range(): Interval {
        return self.y_range
      },
      get target_range(): Interval {
        return self.y_range
      },
    })
  }

  private _x_screen?: CoordinateMapper
  get x_screen(): CoordinateMapper {
    const self = this
    return this._x_screen ?? (this._x_screen = {
      compute(x: number): number {
        return self.left + x
      },
      invert(sx: number): number {
        return sx - self.left
      },
      v_compute(xs: Arrayable<number>): ScreenArray {
        const {left} = self
        return new ScreenArray(map(xs, (x) => left + x))
      },
      v_invert(sxs: Arrayable<number>): Arrayable<number> {
        const {left} = self
        return map(sxs, (sx) => sx - left)
      },
      get source_range(): Interval {
        return self.x_range
      },
      get target_range(): Interval {
        return self.x_range
      },
    })
  }

  private _y_screen?: CoordinateMapper
  get y_screen(): CoordinateMapper {
    const self = this
    return this._y_screen ?? (this._y_screen = {
      compute(y: number): number {
        return self.top + y
      },
      invert(sy: number): number {
        return sy - self.top
      },
      v_compute(ys: Arrayable<number>): ScreenArray {
        const {top} = self
        return new ScreenArray(map(ys, (y) => top + y))
      },
      v_invert(sys: Arrayable<number>): Arrayable<number> {
        const {top} = self
        return map(sys, (sy) => sy - top)
      },
      get source_range(): Interval {
        return self.y_range
      },
      get target_range(): Interval {
        return self.y_range
      },
    })
  }

  private _x_view?: CoordinateMapper
  get x_view(): CoordinateMapper {
    const self = this
    return this._x_view ?? (this._x_view = {
      compute(x: number): number {
        return self.left + x
      },
      invert(sx: number): number {
        return sx - self.left
      },
      v_compute(xs: Arrayable<number>): ScreenArray {
        const {left} = self
        return new ScreenArray(map(xs, (x) => left + x))
      },
      v_invert(sxs: Arrayable<number>): Arrayable<number> {
        const {left} = self
        return map(sxs, (sx) => sx - left)
      },
      get source_range(): Interval {
        return self.x_range
      },
      get target_range(): Interval {
        return self.x_range
      },
    })
  }

  private _y_view?: CoordinateMapper
  get y_view(): CoordinateMapper {
    const self = this
    return this._y_view ?? (this._y_view = {
      compute(y: number): number {
        return self.bottom - y
      },
      invert(sy: number): number {
        return self.bottom - sy
      },
      v_compute(ys: Arrayable<number>): ScreenArray {
        const {bottom} = self
        return new ScreenArray(map(ys, (y) => bottom - y))
      },
      v_invert(sys: Arrayable<number>): Arrayable<number> {
        const {bottom} = self
        return map(sys, (sy) => bottom - sy)
      },
      get source_range(): Interval {
        return self.y_range
      },
      get target_range(): Interval {
        return {start: self.bottom, end: self.top}
      },
    })
  }

  get xview(): CoordinateMapper {
    return this.x_view
  }

  get yview(): CoordinateMapper {
    return this.y_view
  }
}
