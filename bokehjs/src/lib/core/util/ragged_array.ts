import {NumberArray} from "../types"
import {equals, Equatable, Comparator} from "./eq"
import {assert} from "./assert"

export class RaggedArray implements Equatable {
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

  private _check_bounds(i: number): void {
    assert(0 <= i && i < this.length, `Out of bounds: 0 <= ${i} < ${this.length}`)
  }

  get(i: number): NumberArray {
    this._check_bounds(i)
    const {offsets} = this
    return this.array.subarray(offsets[i], offsets[i + 1])
  }

  set(i: number, array: ArrayLike<number>): void {
    this._check_bounds(i)
    this.array.set(array, this.offsets[i])
  }
}
