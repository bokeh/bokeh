import type {Constructor} from "../class"
import type {Arrayable, TypedArray} from "../types"
import type {Equatable, Comparator} from "./eq"
import {equals} from "./eq"
import {assert} from "./assert"

type OffsetArray = Uint8Array | Uint16Array | Uint32Array

export class RaggedArray<ArrayType extends TypedArray = Float64Array> implements Equatable {
  static [Symbol.toStringTag] = "RaggedArray"

  constructor(readonly offsets: OffsetArray, readonly data: ArrayType) {}

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.arrays(this.offsets, that.offsets) && cmp.arrays(this.data, that.data)
  }

  get length(): number {
    return this.offsets.length
  }

  clone(): RaggedArray<ArrayType> {
    return new RaggedArray<ArrayType>(this.offsets.slice(), this.data.slice() as ArrayType)
  }

  static from<ArrayType extends TypedArray>(items: Arrayable<Arrayable<number>>, ctor: Constructor<ArrayType>): RaggedArray<ArrayType> {
    const n = items.length
    let offset = 0
    const offsets = (() => {
      const offsets = new Uint32Array(n)
      for (let i = 0; i < n; i++) {
        const length = items[i].length
        offsets[i] = offset
        offset += length
      }
      if (offset < 256) {
        return new Uint8Array(offsets)
      } else if (offset < 65536) {
        return new Uint16Array(offsets)
      } else {
        return offsets
      }
    })()
    const array = new ctor(offset)
    for (let i = 0; i < n; i++) {
      array.set(items[i], offsets[i])
    }
    return new RaggedArray(offsets, array)
  }

  *[Symbol.iterator](): IterableIterator<ArrayType> {
    const {offsets, length} = this
    for (let i = 0; i < length; i++) {
      yield this.data.subarray(offsets[i], offsets[i + 1]) as ArrayType
    }
  }

  private _check_bounds(i: number): void {
    assert(0 <= i && i < this.length, `Out of bounds: 0 <= ${i} < ${this.length}`)
  }

  get(i: number): ArrayType {
    this._check_bounds(i)
    const {offsets} = this
    return this.data.subarray(offsets[i], offsets[i + 1]) as ArrayType
  }

  set(i: number, array: ArrayLike<number>): void {
    this._check_bounds(i)
    this.data.set(array, this.offsets[i])
  }
}
