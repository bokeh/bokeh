import {Rect} from "./spatial"

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
    minX: Math.min(a.minX, b.minX),
    maxX: Math.max(a.maxX, b.maxX),
    minY: Math.min(a.minY, b.minY),
    maxY: Math.max(a.maxY, b.maxY),
  }
}

export interface IBBox {
  x0: number
  y0: number
  x1: number
  y1: number
}

export class BBox implements IBBox {

  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number

  constructor(bbox?: IBBox) {
    if (bbox == null) {
      this.x0 =  Infinity
      this.y0 = -Infinity
      this.x1 =  Infinity
      this.y1 = -Infinity
    } else {
      this.x0 = bbox.x0
      this.y0 = bbox.y0
      this.x1 = bbox.x1
      this.y1 = bbox.y1
    }
  }

  get minX(): number { return this.x0 }
  get minY(): number { return this.y0 }

  get maxX(): number { return this.x1 }
  get maxY(): number { return this.y1 }

  get pt0(): [number, number] { return [this.x0, this.y0] }
  get pt1(): [number, number] { return [this.x1, this.y1] }

  get x(): number { return this.x0 }
  get y(): number { return this.x1 }
  get width(): number { return this.x1 - this.x0 }
  get height(): number { return this.y1 - this.y0 }

  contains(x: number, y: number): boolean {
    return x >= this.x0 && x <= this.x1 && y >= this.y0 && y <= this.y1
  }

  union(that: IBBox): BBox {
    return new BBox({
      x0: Math.min(this.x0, that.x0),
      y0: Math.min(this.y0, that.y0),
      x1: Math.max(this.x1, that.x1),
      y1: Math.max(this.y1, that.y1),
    })
  }
}
