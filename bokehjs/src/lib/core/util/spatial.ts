import FlatBush from "flatbush"

import {Rect} from "../types"
import {empty} from "./bbox"

export type IndexedRect = Rect & {i: number}

export class SpatialIndex {
  private readonly index: FlatBush | null = null

  constructor(private readonly points: IndexedRect[]) {
    if (points.length > 0) {
      this.index = new FlatBush(points.length)

      for (const p of points) {
        const {x0, y0, x1, y1} = p
        this.index.add(x0, y0, x1, y1)
      }

      this.index.finish()
    }
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

  search(rect: Rect): IndexedRect[] {
    if (this.index == null)
      return []
    else {
      const {x0, y0, x1, y1} = this._normalize(rect)
      const indices = this.index.search(x0, y0, x1, y1)
      return indices.map((j) => this.points[j])
    }
  }

  indices(rect: Rect): number[] {
    return this.search(rect).map(({i}) => i)
  }
}
