import FlatBush from "flatbush"

import type {Rect} from "../types"
import {Indices} from "../types"
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

  search_apply(minX: number, minY: number, maxX: number, maxY: number, nodeFunction: (index: number, node: Rect) => void): void {
    if (this._pos !== this._boxes.length) {
      throw new Error("Data not yet indexed - call index.finish().")
    }

    let nodeIndex: number | undefined = this._boxes.length - 4
    const queue = []

    while (nodeIndex !== undefined) {
      // find the end index of the node
      const end = Math.min(nodeIndex + this.nodeSize * 4, upperBound(nodeIndex, this._levelBounds))

      // search through child nodes
      for (let pos: number = nodeIndex; pos < end; pos += 4) {
        const nodeMinX = this._boxes[pos + 0]
        const nodeMinY = this._boxes[pos + 1]
        const nodeMaxX = this._boxes[pos + 2]
        const nodeMaxY = this._boxes[pos + 3]

        if (maxX < nodeMinX || maxY < nodeMinY || minX > nodeMaxX || minY > nodeMaxY) {
          continue
        }

        if (minX <= nodeMinX && minY <= nodeMinY && maxX >= nodeMaxX && maxY >= nodeMaxY) {
          let pos_start = pos
          let pos_end = pos

          // depth search while not leaf
          while (pos_start >= this.numItems * 4) {
            pos_start = this._indices[pos_start >> 2] | 0
            const pos_end_start = this._indices[pos_end >> 2] | 0
            pos_end = Math.min(pos_end_start + this.nodeSize * 4, upperBound(pos_end_start, this._levelBounds))-4
          }

          for (let leaf_pos: number = pos_start; leaf_pos <= pos_end; leaf_pos += 4) {
            const nodeMinX = this._boxes[leaf_pos + 0]
            const nodeMinY = this._boxes[leaf_pos + 1]
            const nodeMaxX = this._boxes[leaf_pos + 2]
            const nodeMaxY = this._boxes[leaf_pos + 3]
            const leaf_index = this._indices[leaf_pos >> 2]
            nodeFunction(leaf_index, {x0: nodeMinX, y0: nodeMinY, x1: nodeMaxX, y1: nodeMaxY})
          }
          continue
        }

        const index = this._indices[pos >> 2] | 0

        if (nodeIndex < this.numItems * 4) {
          nodeFunction(index, {x0: nodeMinX, y0: nodeMinY, x1: nodeMaxX, y1: nodeMaxY})
        } else {
          queue.push(index) // node; add it to the search queue
        }

      }

      nodeIndex = queue.pop()
    }
  }

  search_indices(minX: number, minY: number, maxX: number, maxY: number): Indices {
    const result = new Indices(this.numItems)
    this.search_apply(minX, minY, maxX, maxY, (index) => result.set_without_bounds_check(index))
    return result
  }

  search_bounds(minX: number, minY: number, maxX: number, maxY: number): Rect {
    const result = empty()
    this.search_apply(minX, minY, maxX, maxY, (_index, node) => {
      if (node.x0 >= minX && node.x0 < result.x0) {
        result.x0 = node.x0
      }
      if (node.x1 <= maxX && node.x1 > result.x1) {
        result.x1 = node.x1
      }
      if (node.y0 >= minY && node.y0 < result.y0) {
        result.y0 = node.y0
      }
      if (node.y1 <= maxY && node.y1 > result.y1) {
        result.y1 = node.y1
      }
    })
    return result
  }
}

export class SpatialIndex {
  private readonly index: _FlatBush | null = null

  constructor(size: number) {
    if (size > 0) {
      this.index = new _FlatBush(size)
    }
  }

  add_rect(x0: number, y0: number, x1: number, y1: number): void {
    if (!isFinite(x0 + y0 + x1 + y1)) {
      this.add_empty()
    } else {
      this.index?.add(x0, y0, x1, y1)
    }
  }

  add_point(x: number, y: number) {
    if (!isFinite(x + y)) {
      this.add_empty()
    } else {
      this.index?.add(x, y, x, y)
    }
  }

  add_empty(): void {
    this.index?.add(Infinity, Infinity, -Infinity, -Infinity)
  }

  finish(): void {
    this.index?.finish()
  }

  protected _normalize(rect: Rect): Rect {
    let {x0, y0, x1, y1} = rect
    if ((x0 > x1) && isFinite(x0 + x1)) {
      [x0, x1] = [x1, x0]
    }
    if ((y0 > y1) && isFinite(y0 + y1)) {
      [y0, y1] = [y1, y0]
    }
    return {x0, y0, x1, y1}
  }

  get bbox(): Rect {
    if (this.index == null) {
      return empty()
    } else {
      const {minX, minY, maxX, maxY} = this.index
      return {x0: minX, y0: minY, x1: maxX, y1: maxY}
    }
  }

  indices(rect: Rect): Indices {
    if (this.index == null) {
      return new Indices(0)
    } else {
      const {x0, y0, x1, y1} = this._normalize(rect)
      return this.index.search_indices(x0, y0, x1, y1)
    }
  }

  bounds(rect: Rect): Rect {
    if (this.index == null) {
      return empty()
    } else {
      const {x0, y0, x1, y1} = this._normalize(rect)
      return this.index.search_bounds(x0, y0, x1, y1)
    }
  }
}
