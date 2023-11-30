import type {Arrayable, ArrayableNew, Indices} from "../types"
import {AssertionError} from "./assert"
import {BitSet} from "./bitset"
import {range} from "./array"

export const PackedIndices = BitSet
export type PackedIndices = BitSet

export class OpaqueIndices implements Indices {

  protected readonly _array: number[]

  constructor(readonly size: number, init: Iterable<number> | 1 | 0 = 0) {
    if (init == 0) {
      this._array = []
    } else if (init == 1) {
      this._array = range(0, size)
    } else {
      this._array = [...init]
    }
    this.count = this._array.length
  }

  readonly count: number

  get array(): number[] { // TODO readonly
    return this._array
  }

  static from_packed(indices: PackedIndices): OpaqueIndices {
    return new OpaqueIndices(indices.size, indices)
  }

  *[Symbol.iterator](): Iterator<number> {
    yield* this._array
  }

  select<T>(array: Arrayable<T>): Arrayable<T> {
    this._check_array_length(array)
    const n = this.count
    if (n == this.size) {
      return array.slice()
    } else {
      const result = new (array.constructor as ArrayableNew)<T>(n)
      let i = 0
      for (const j of this._array) {
        result[i++] = array[j]
      }
      return result
    }
  }

  protected _check_array_length(other: Arrayable) {
    if (!(this.size <= other.length)) {
      throw new AssertionError(`Size mismatch (${this.size} != ${other.length})`)
    }
  }
}
