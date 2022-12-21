import {Arrayable, ScreenArray, Rect, Box, Interval, Size} from "../types"
import {equals, Equatable, Comparator} from "./eq"
import * as affine from "./affine"

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

export function union(a: Rect, b: Rect): Rect {
  return {
    x0: min(a.x0, b.x0),
    x1: max(a.x1, b.x1),
    y0: min(a.y0, b.y0),
    y1: max(a.y1, b.y1),
  }
}

export type XY<T = number> = {
  x: T
  y: T
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
  compute: (v: number) => number
  v_compute: (vv: Arrayable<number>) => ScreenArray
  invert: (sv: number) => number
  v_invert: (svv: ScreenArray) => Arrayable<number>
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
      if (!(x0 <= x1 && y0 <= y1))
        throw new Error(`invalid bbox {x0: ${x0}, y0: ${y0}, x1: ${x1}, y1: ${y1}}`)
      this.x0 = x0
      this.y0 = y0
      this.x1 = x1
      this.y1 = y1
    } else if ("x" in box) {
      const {x, y, width, height} = box
      if (!(width >= 0 && height >= 0))
        throw new Error(`invalid bbox {x: ${x}, y: ${y}, width: ${width}, height: ${height}}`)
      this.x0 = x
      this.y0 = y
      this.x1 = x + width
      this.y1 = y + height
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
          if (left > right)
            left = right
          if (top > bottom)
            top = bottom
        } else
          throw new Error(`invalid bbox {left: ${left}, top: ${top}, right: ${right}, bottom: ${bottom}}`)
      }

      this.x0 = left
      this.y0 = top
      this.x1 = right
      this.y1 = bottom
    }
  }

  static from_lrtb({left, right, top, bottom}: LRTB): BBox {
    return new BBox({
      x0: Math.min(left, right),
      y0: Math.min(top, bottom),
      x1: Math.max(left, right),
      y1: Math.max(top, bottom),
    })
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

  get is_empty(): boolean {
    const {x0, x1, y0, y1} = this
    return x0 == 0 && x1 == 0 && y0 == 0 && y1 == 0
  }

  get left(): number { return this.x0 }
  get top(): number { return this.y0 }
  get right(): number { return this.x1 }
  get bottom(): number { return this.y1 }

  get p0(): XY<number> { return {x: this.x0, y: this.y0} }
  get p1(): XY<number> { return {x: this.x1, y: this.y1} }

  get x(): number { return this.x0 }
  get y(): number { return this.y0 }
  get width(): number { return this.x1 - this.x0 }
  get height(): number { return this.y1 - this.y0 }

  get size(): Size { return {width: this.width, height: this.height} }

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

  get h_range(): Interval { return {start: this.x0, end: this.x1} }
  get v_range(): Interval { return {start: this.y0, end: this.y1} }

  get ranges(): [Interval, Interval] { return [this.h_range, this.v_range] }

  get aspect(): number { return this.width/this.height }

  get hcenter(): number { return (this.left + this.right)/2 }
  get vcenter(): number { return (this.top + this.bottom)/2 }

  get area(): number { return this.width*this.height }

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

  translate(tx: number, ty: number): BBox {
    const {x, y, width, height} = this
    return new BBox({x: tx + x, y: ty + y, width, height})
  }

  relativize(x: number, y: number): [number, number] {
    return [x - this.x, y - this.y]
  }

  contains(x: number, y: number): boolean {
    return this.x0 <= x && x <= this.x1 && this.y0 <= y && y <= this.y1
  }

  clip(x: number, y: number): [number, number] {
    if (x < this.x0)
      x = this.x0
    else if (x > this.x1)
      x = this.x1

    if (y < this.y0)
      y = this.y0
    else if (y > this.y1)
      y = this.y1

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
    if (!this.intersects(that))
      return null
    else {
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

  get xview(): CoordinateMapper {
    return {
      compute: (x: number): number => {
        return this.left + x
      },
      v_compute: (xx: Arrayable<number>): ScreenArray => {
        const sxx = new ScreenArray(xx.length)
        const left = this.left
        for (let i = 0; i < xx.length; i++) {
          sxx[i] = left + xx[i]
        }
        return sxx
      },
      invert: (sx: number): number => {
        return sx - this.left
      },
      v_invert: (sxx: ScreenArray): Arrayable<number> => {
        const xx = new ScreenArray(sxx.length)
        const left = this.left
        for (let i = 0; i < sxx.length; i++) {
          xx[i] = sxx[i] - left
        }
        return xx
      },
    }
  }

  get yview(): CoordinateMapper {
    return {
      compute: (y: number): number => {
        return this.bottom - y
      },
      v_compute: (yy: Arrayable<number>): ScreenArray => {
        const syy = new ScreenArray(yy.length)
        const bottom = this.bottom
        for (let i = 0; i < yy.length; i++) {
          syy[i] = bottom - yy[i]
        }
        return syy
      },
      invert: (sy: number): number => {
        return this.bottom - sy
      },
      v_invert: (syy: ScreenArray): Arrayable<number> => {
        const yy = new ScreenArray(syy.length)
        const bottom = this.bottom
        for (let i = 0; i < syy.length; i++) {
          yy[i] = bottom - syy[i]
        }
        return yy
      },
    }
  }
}
