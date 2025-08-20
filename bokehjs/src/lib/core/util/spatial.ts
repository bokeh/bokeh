import FlatBush from "flatbush"

import type {Rect} from "../types"
import {Indices} from "../types"
import {empty} from "./bbox"

export class SpatialIndex {
  private readonly index: FlatBush | null = null

  constructor(size: number) {
    if (size > 0) {
      this.index = new FlatBush(size)
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
    }

    const {x0, y0, x1, y1} = this._normalize(rect)
    const result = new Indices(this.index.numItems)
    this.index.search(x0, y0, x1, y1, (index) => {
      result.set_unchecked(index)
      return false
    })
    return result

  }

  bounds(rect: Rect): Rect {
    if (this.index == null) {
      return empty()
    }

    const {x0, y0, x1, y1} = this._normalize(rect)
    const result = empty()
    this.index.search(x0, y0, x1, y1, (_, node_x0, node_y0, node_x1, node_y1) => {
      if (node_x0 >= x0 && node_x0 < result.x0) {
        result.x0 = node_x0
      }
      if (node_x1 <= x1 && node_x1 > result.x1) {
        result.x1 = node_x1
      }
      if (node_y0 >= y0 && node_y0 < result.y0) {
        result.y0 = node_y0
      }
      if (node_y1 <= y1 && node_y1 > result.y1) {
        result.y1 = node_y1
      }
      return false
    })
    return result
  }
}
