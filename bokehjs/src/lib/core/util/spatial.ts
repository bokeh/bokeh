import FlatBush from "flatbush"

import {Indices, Rect} from "../types"
import {empty} from "./bbox"

function upperBound(value: number, arr: ArrayLike<number>): number {
  let i = 0
  let j = arr.length - 1
  while (i < j) {
    const m = (i + j) >> 1
    if (arr[m] > value) {
      j = m
    } else {
      i = m + 1
    }
  }
  return arr[i]
}

class _FlatBush extends FlatBush {
  protected _pos: number
  protected _boxes: Float64Array
  protected _indices: Uint16Array | Uint32Array
  protected _levelBounds: number[]

  search_indices(minX: number, minY: number, maxX: number, maxY: number): Indices {
    if (this._pos !== this._boxes.length) {
      throw new Error('Data not yet indexed - call index.finish().')
    }

    let nodeIndex = this._boxes.length - 4
    const queue = []
    const results = new Indices(this.numItems)

    while (nodeIndex !== undefined) {
      // find the end index of the node
      const end = Math.min(nodeIndex + this.nodeSize * 4, upperBound(nodeIndex, this._levelBounds))

      // search through child nodes
      for (let pos = nodeIndex; pos < end; pos += 4) {
        const index = this._indices[pos >> 2] | 0

        // check if node bbox intersects with query bbox
        if (maxX < this._boxes[pos + 0]) continue // maxX < nodeMinX
        if (maxY < this._boxes[pos + 1]) continue // maxY < nodeMinY
        if (minX > this._boxes[pos + 2]) continue // minX > nodeMaxX
        if (minY > this._boxes[pos + 3]) continue // minY > nodeMaxY

        if (nodeIndex < this.numItems * 4) {
          results.set(index) // leaf item
        } else {
          queue.push(index) // node; add it to the search queue
        }
      }

      nodeIndex = queue.pop()!
    }

    return results
  }
}


export class SpatialIndex {
  private readonly index: _FlatBush | null = null

  constructor(size: number) {
    if (size > 0) {
      this.index = new _FlatBush(size)
    }
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

  indices(rect: Rect): Indices {
    if (this.index == null)
      return new Indices(0)
    else {
      const {x0, y0, x1, y1} = this._normalize(rect)
      return this.index.search_indices(x0, y0, x1, y1)
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
