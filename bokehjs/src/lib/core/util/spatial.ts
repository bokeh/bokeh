import FlatBush from "flatbush"

import {Rect} from "../types"
import {empty} from "./bbox"

export type IndexedRect = Rect & {i: number}

export class SpatialIndex {
  private readonly index: FlatBush | null = null

  constructor(size: number) {
    if (size > 0) {
      this.index = new FlatBush(size)
    }
  }

  static from(points: IndexedRect[]): SpatialIndex {
    const index = new SpatialIndex(points.length)

    for (const p of points) {
      const {x0, y0, x1, y1} = p
      index.add(x0, y0, x1, y1)
    }

    index.finish()
    return index
  }

  add(x0: number, y0: number, x1: number, y1: number): void {
    this.index?.add(x0, y0, x1, y1)
  }

  add_empty(): void {
    this.index?.add(Infinity, Infinity, -Infinity, -Infinity)
  }

  finish(): void {
    this.index?.finish()
  }

  protected _normalize(rect: Rect): Rect {
    let {x0, y0, x1, y1} = rect
    if (x0 > x1)
      [x0, x1] = [x1, x0]
    if (y0 > y1)
      [y0, y1] = [y1, y0]
    return {x0, y0, x1, y1}
  }

  get bbox(): Rect {
    if (this.index == null)
      return empty()
    else {
      const {minX, minY, maxX, maxY} = this.index
      return {x0: minX, y0: minY, x1: maxX, y1: maxY}
    }
  }

  indices(rect: Rect): number[] {
    if (this.index == null)
      return []
    else {
      const {x0, y0, x1, y1} = this._normalize(rect)
      return this.index.search(x0, y0, x1, y1)
    }
  }

  bounds(rect: Rect): Rect {
    const bounds = empty()

    for (const i of this.indices(rect)) {
      const boxes = (this.index as any)._boxes as Float64Array
      const x1 = boxes[4*i + 0]
      const y1 = boxes[4*i + 1]
      const x0 = boxes[4*i + 2]
      const y0 = boxes[4*i + 3]
      if (x0 < bounds.x0)
        bounds.x0 = x0
      if (x1 > bounds.x1)
        bounds.x1 = x1
      if (y0 < bounds.y0)
        bounds.y0 = y0
      if (y1 > bounds.y1)
        bounds.y1 = y1
    }

    return bounds
  }
}
