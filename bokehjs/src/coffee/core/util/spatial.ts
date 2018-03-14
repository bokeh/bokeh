import * as rbush from "rbush"

export type Rect = {minX: number, minY: number, maxX: number, maxY: number}
export type IndexedRect = Rect & {i: number}

export abstract class SpatialIndex {
  abstract indices(rect: Rect): number[]
  abstract search(rect: Rect): IndexedRect[]
  readonly bbox: Rect
}

export class RBush extends SpatialIndex {
  private readonly index: rbush.RBush<IndexedRect>

  constructor(points: IndexedRect[]) {
    super()
    this.index = rbush<IndexedRect>()
    this.index.load(points)
  }

  get bbox(): Rect {
    const {minX, minY, maxX, maxY} = this.index.toJSON()
    return {minX, minY, maxX, maxY}
  }

  search(rect: Rect): IndexedRect[] {
    return this.index.search(rect)
  }

  indices(rect: Rect): number[] {
    const points = this.search(rect)
    const n = points.length
    const indices: number[] = new Array(n)
    for (let j = 0; j < n; j++) {
      indices[j] = points[j].i
    }
    return indices
  }
}
