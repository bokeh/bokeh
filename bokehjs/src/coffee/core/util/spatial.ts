import flatbush = require("flatbush")

export type Rect = {minX: number, minY: number, maxX: number, maxY: number}
export type IndexedRect = Rect & {i: number}

export class SpatialIndex {
  private readonly index = flatbush(this.points.length)

  constructor(private readonly points: IndexedRect[]) {
    for (const p of points) {
      const {minX, minY, maxX, maxY} = p
      this.index.add(minX, minY, maxX, maxY)
    }
    this.index.finish()
  }

  get bbox(): Rect {
    return {
      minX: this.index._minX,
      minY: this.index._minY,
      maxX: this.index._maxX,
      maxY: this.index._maxY,
    }
  }

  search(rect: Rect): IndexedRect[] {
    const indices = this.indices(rect)
    const {data} = this.index
    const rects = []
    for (const i of indices) {
      const j = i*5
      const minX = data[j+1]
      const minY = data[j+2]
      const maxX = data[j+3]
      const maxY = data[j+4]
      rects.push({minX, minY, maxX, maxY, i})
    }
    return rects
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
