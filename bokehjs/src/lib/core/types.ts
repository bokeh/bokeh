export type ID = string

export type Color = string

export {TypedArray} from "./util/ndarray"

export type NumberArray = Float32Array
export const NumberArray = Float32Array

export type ColorArray = Uint32Array
export const ColorArray = Uint32Array

import {equals, Equals, Comparator} from "core/util/eq"

export class RaggedArray implements Equals {

  static [Symbol.toStringTag] = "RaggedArray"

  constructor(readonly offsets: Uint32Array, readonly array: NumberArray) {}

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.arrays(this.offsets, that.offsets) && cmp.arrays(this.array, that.array)
  }

  get length(): number {
    return this.offsets.length
  }

  clone(): RaggedArray {
    return new RaggedArray(new Uint32Array(this.offsets), new NumberArray(this.array))
  }

  static from(items: number[][]): RaggedArray {
    const n = items.length
    const offsets = new Uint32Array(n)
    let offset = 0
    for (let i = 0; i < n; i++) {
      const length = items[i].length
      offsets[i] = offset
      offset += length
    }
    const array = new NumberArray(offset)
    for (let i = 0; i < n; i++) {
      array.set(items[i], offsets[i])
    }
    return new RaggedArray(offsets, array)
  }

  *[Symbol.iterator](): IterableIterator<NumberArray> {
    const {offsets, length} = this
    for (let i = 0; i < length; i++) {
      yield this.array.subarray(offsets[i], offsets[i + 1])
    }
  }

  get(i: number): NumberArray {
    const {offsets} = this
    return this.array.subarray(offsets[i], offsets[i + 1])
  }

  set(i: number, array: ArrayLike<number>): void {
    this.array.set(array, this.offsets[i])
  }
}

export type Arrayable<T = any> = {
  readonly length: number
  [n: number]: T
  [Symbol.iterator](): IterableIterator<T>
  // TODO: constructor: ArrayableNew
}

export type ArrayableNew = {new <T>(n: number): Arrayable<T>}

export type ArrayableOf<T> = T extends unknown ? Arrayable<T> : never

export type Data = {[key: string]: Arrayable<unknown>}

export type Attrs = {[key: string]: unknown}

export type PlainObject<T = unknown> = {[key: string]: T}

export type Size = {
  width: number
  height: number
}

export type Box = {
  x: number
  y: number
  width: number
  height: number
}

export type Rect = {
  x0: number
  y0: number
  x1: number
  y1: number
}

export type Extents = {
  left: number
  top: number
  right: number
  bottom: number
}

export type Interval = {
  start: number
  end: number
}

export {BitSet as Indices} from "./util/data_structures"
