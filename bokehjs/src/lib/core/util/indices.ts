import type {Arrayable, ArrayableNew, Indices} from "../types"
import {AssertionError} from "./assert"
import {BitSet} from "./bitset"
import {range} from "./array"

export const PackedIndices = BitSet
export type PackedIndices = BitSet

export class OpaqueIndices implements Indices {

  protected readonly _indices: Set<number>

  constructor(readonly size: number, init: Iterable<number> | 1 | 0 = 0) {
    if (init == 0) {
      this._indices = new Set()
    } else if (init == 1) {
      this._indices = new Set(range(0, size))
    } else {
      this._indices = new Set(init)
    }
    this.count = this._indices.size
  }

  readonly count: number

  get array(): number[] {
    return [...this._indices]
  }

  static from(indices: Indices): OpaqueIndices {
    return new OpaqueIndices(indices.size, indices)
  }

  *[Symbol.iterator](): Iterator<number> {
    yield* this._indices
  }

  clone(): OpaqueIndices {
    return new OpaqueIndices(this.size, this._indices)
  }

  get(k: number): boolean {
    return this._indices.has(k)
  }

  set(k: number, v: boolean = true): void {
    if (v) {
      this._indices.add(k)
    } else {
      this._indices.delete(k)
    }
  }

  unset(k: number): void {
    this.set(k, false)
  }

  select<T>(array: Arrayable<T>): Arrayable<T> {
    this._check_array_length(array)
    const n = this.count
    if (n == this.size) {
      return array.slice()
    } else {
      const result = new (array.constructor as ArrayableNew)<T>(n)
      let i = 0
      for (const j of this._indices) {
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

  invert(): void {
    const {_indices, size} = this
    for (let i = 0; i < size; i++) {
      if (!_indices.has(i)) {
        this._indices.add(i)
      } else {
        this._indices.delete(i)
      }
    }
  }

  add(other: Indices): void {
    const {_indices} = this
    for (const i of other) {
      _indices.add(i)
    }
  }

  intersect(other: Indices): void {
    const {_indices} = this
    for (const i of _indices) {
      if (!other.get(i)) {
        _indices.delete(i)
      }
    }
  }

  subtract(other: Indices): void {
    const {_indices} = this
    for (const i of other) {
      _indices.delete(i)
    }
  }

  symmetric_subtract(other: Indices): void {
    const {_indices} = this
    const set0 = new Set(_indices)
    const set1 = other
    _indices.clear()

    for (const i of set0) {
      if (!set1.get(i)) {
        _indices.add(i)
      }
    }
    for (const i of set1) {
      if (!set0.has(i)) {
        _indices.add(i)
      }
    }
  }

  inversion(): OpaqueIndices {
    const result = this.clone()
    result.invert()
    return result
  }

  union(other: Indices): OpaqueIndices {
    const result = this.clone()
    result.add(other)
    return result
  }

  intersection(other: Indices): OpaqueIndices {
    const result = this.clone()
    result.intersect(other)
    return result
  }

  difference(other: Indices): OpaqueIndices {
    const result = this.clone()
    result.subtract(other)
    return result
  }

  symmetric_difference(other: Indices): OpaqueIndices {
    const result = this.clone()
    result.symmetric_subtract(other)
    return result
  }
}
