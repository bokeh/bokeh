import {Rect} from "./spatial"
import {Arrayable} from "../types"

const {min, max} = Math

export function empty(): Rect {
  return {
    minX:  Infinity,
    minY:  Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  }
}

export function positive_x(): Rect {
  return {
    minX:  Number.MIN_VALUE,
    minY: -Infinity,
    maxX:  Infinity,
    maxY:  Infinity,
  }
}

export function positive_y(): Rect {
  return {
    minX: -Infinity,
    minY:  Number.MIN_VALUE,
    maxX:  Infinity,
    maxY:  Infinity,
  }
}

export function union(a: Rect, b: Rect): Rect {
  return {
    minX: min(a.minX, b.minX),
    maxX: max(a.maxX, b.maxX),
    minY: min(a.minY, b.minY),
    maxY: max(a.maxY, b.maxY),
  }
}

export interface IBBox {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface IRect {
  left: number
  top: number
  width: number
  height: number
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

export interface IRange {
  start: number
  end: number
}

export interface CoordinateTransform {
  compute: (v: number) => number
  v_compute: (vv: Arrayable<number>) => Arrayable<number>
}

export class BBox implements IBBox {

  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number

  constructor(box?: IBBox | IRect | Position) {
    if (box == null) {
      this.x0 = 0
      this.y0 = 0
      this.x1 = 0
      this.y1 = 0
    } else if ('x0' in box) {
      const {x0, y0, x1, y1} = box as IBBox
      if (!(x0 <= x1 && y0 <= y1))
        throw new Error(`invalid bbox {x0: ${x0}, y0: ${y0}, x1: ${x1}, y1: ${y1}}`)
      this.x0 = x0
      this.y0 = y0
      this.x1 = x1
      this.y1 = y1
    } else if ("x" in box) {
      const {left, top, width, height} = box as IRect
      if (!(width >= 0 && height >= 0))
        throw new Error(`invalid bbox {left: ${left}, top: ${top}, width: ${width}, height: ${height}}`)
      this.x0 = left
      this.y0 = top
      this.x1 = left + width
      this.y1 = top + height
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

      if (!(left <= right && top <= bottom))
        throw new Error(`invalid bbox {left: ${left}, top: ${top}, right: ${right}, bottom: ${bottom}}`)

      this.x0 = left
      this.y0 = top
      this.x1 = right
      this.y1 = bottom
    }
  }

  toString(): string {
    return `BBox({left: ${this.left}, top: ${this.top}, width: ${this.width}, height: ${this.height}})`
  }

  get minX(): number { return this.x0 }
  get minY(): number { return this.y0 }
  get maxX(): number { return this.x1 }
  get maxY(): number { return this.y1 }

  get left(): number { return this.x0 }
  get top(): number { return this.y0 }
  get right(): number { return this.x1 }
  get bottom(): number { return this.y1 }

  get p0(): [number, number] { return [this.x0, this.y0] }
  get p1(): [number, number] { return [this.x1, this.y1] }

  get x(): number { return this.x0 }
  get y(): number { return this.y0 }
  get width(): number { return this.x1 - this.x0 }
  get height(): number { return this.y1 - this.y0 }

  get rect(): IRect { return {left: this.left, top: this.top, width: this.width, height: this.height} }

  get h_range(): IRange { return {start: this.x0, end: this.x1} }
  get v_range(): IRange { return {start: this.y0, end: this.y1} }

  get ranges(): [IRange, IRange] { return [this.h_range, this.v_range] }

  get aspect(): number { return this.width/this.height }

  get hcenter(): number { return (this.left + this.right)/2 }
  get vcenter(): number { return (this.top + this.bottom)/2 }

  contains(x: number, y: number): boolean {
    return x >= this.x0 && x <= this.x1 && y >= this.y0 && y <= this.y1
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

  union(that: IBBox): BBox {
    return new BBox({
      x0: min(this.x0, that.x0),
      y0: min(this.y0, that.y0),
      x1: max(this.x1, that.x1),
      y1: max(this.y1, that.y1),
    })
  }

  equals(that: IBBox): boolean {
    return this.x0 == that.x0 && this.y0 == that.y0 && this.x1 == that.x1 && this.y1 == that.y1
  }

  get xview(): CoordinateTransform {
    return {
      compute: (x: number): number => {
        return this.left + x
      },
      v_compute: (xx: Arrayable<number>): Arrayable<number> => {
        const _xx = new Float64Array(xx.length)
        const left = this.left
        for (let i = 0; i < xx.length; i++) {
          _xx[i] = left + xx[i]
        }
        return _xx
      },
    }
  }

  get yview(): CoordinateTransform {
    return {
      compute: (y: number): number => {
        return this.bottom - y
      },
      v_compute: (yy: Arrayable<number>): Arrayable<number> => {
        const _yy = new Float64Array(yy.length)
        const bottom = this.bottom
        for (let i = 0; i < yy.length; i++) {
          _yy[i] = bottom - yy[i]
        }
        return _yy
      },
    }
  }
}
