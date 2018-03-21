import FlatBush = require("flatbush")
import {empty} from "./bbox"

export type Rect = {minX: number, minY: number, maxX: number, maxY: number}
export type IndexedRect = Rect & {i: number}

export class SpatialIndex {
  private readonly index: FlatBush | null = null

  constructor(private readonly points: IndexedRect[]) {
    if (points.length > 0) {
      this.index = new FlatBush(points.length)

      for (const p of points) {
        const {minX, minY, maxX, maxY} = p
        this.index.add(minX, minY, maxX, maxY)
      }

      this.index.finish()
    }
  }

  get bbox(): Rect {
    if (this.index == null)
      return empty()
    else {
      const {minX, minY, maxX, maxY} = this.index
      return {minX, minY, maxX, maxY}
    }
  }

  search(rect: Rect): IndexedRect[] {
    if (this.index == null)
      return []
    else {
      const {minX, minY, maxX, maxY} = rect
      const indices = this.index.search(minX, minY, maxX, maxY)
      return indices.map((j) => this.points[j])
    }
  }

  indices(rect: Rect): number[] {
    return this.search(rect).map(({i}) => i)
  }
}
