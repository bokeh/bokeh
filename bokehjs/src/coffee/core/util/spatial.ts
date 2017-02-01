/// <reference types="@types/rbush" />
import * as rbush from "rbush"

export type Rect = {minX: number, minY: number, maxX: number, maxY: number}

export abstract class SpatialIndex {
  abstract indices(rect: Rect): number[]
}

export class RBush extends SpatialIndex {
  private readonly index: rbush.RBush<Rect & {i: number}>

  constructor(points: (Rect & {i: number})[]) {
    super()
    this.index = rbush<Rect & {i: number}>()
    this.index.load(points)
  }

  get bbox(): Rect {
    const {minX, minY, maxX, maxY} = this.index.toJSON()
    return {minX, minY, maxX, maxY}
  }

  search(rect: Rect): (Rect & {i: number})[] {
    return this.index.search(rect)
  }

  indices(rect: Rect): number[] {
    const points = this.search(rect)
    const n = points.length
    const indices = new Array<number>(n)
    for (let j = 0; j < n; j++) {
      indices[j] = points[j].i
    }
    return indices
  }
}
