import {Arrayable, ArrayableNew} from "../types"
import {assert} from "./assert"
import {min} from "./array"
import {equals, Equals, Comparator} from "./eq"

export class BitSet implements Equals {
  private readonly _array: Uint32Array
  private readonly _nwords: number

  constructor(readonly size: number, init: Uint32Array | 1 | 0 = 0) {
    this._nwords = Math.ceil(size/32)
    if (init == 0 || init == 1) {
      this._array = new Uint32Array(this._nwords)
      if (init == 1) {
        this._array.fill(0xffffffff)
      }
    } else {
      assert(init.length == this._nwords, "Initializer size mismatch")
      this._array = init
    }
  }

  [Symbol.toStringTag] = "BitSet"

  clone(): BitSet {
    return new BitSet(this.size, new Uint32Array(this._array))
  }

  [equals](that: this, cmp: Comparator): boolean {
    if (!cmp.eq(this.size, that.size))
      return false
    const {_nwords} = this
    const trailing = this.size % _nwords
    const n = trailing == 0 ? _nwords : _nwords - 1
    for (let i = 0; i < n; i++) {
      if (this._array[i] != that._array[i])
        return false
    }
    if (trailing == 0)
      return true
    else {
      const msb = 1 << (trailing - 1)
      const mask = (msb - 1)^msb
      return (this._array[n] & mask) == (that._array[n] & mask)
    }
  }

  static all_set(size: number): BitSet {
    return new BitSet(size, 1)
  }

  static all_unset(size: number): BitSet {
    return new BitSet(size, 0)
  }

  static from_indices(size: number, indices: number[]): BitSet {
    const bits = new BitSet(size)
    for (const i of indices) {
      bits.set(i)
    }
    return bits
  }

  static from_booleans(size: number, booleans: boolean[]): BitSet {
    const bits = new BitSet(size)
    const n = Math.min(size, booleans.length)
    for (let i = 0; i < n; i++) {
      if (booleans[i])
        bits.set(i)
    }
    return bits
  }

  private _check_bounds(k: number): void {
    assert(0 <= k && k < this.size, "Out of bounds")
  }

  get(k: number): boolean {
    this._check_bounds(k)
    const i = k >>> 5  // Math.floor(k/32)
    const j = k & 0x1f // k % 32
    return !!((this._array[i] >> j) & 0x1)
  }

  set(k: number, v: boolean = true): void {
    this._check_bounds(k)
    this._count = null
    const i = k >>> 5  // Math.floor(k/32)
    const j = k & 0x1f // k % 32
    if (v)
      this._array[i] |= 0x1 << j
    else
      this._array[i] &= ~(0x1 << j)
  }

  unset(k: number): void {
    this.set(k, false)
  }

  *[Symbol.iterator](): Iterator<number> {
    yield* this.ones()
  }

  private _count: number | null = null
  get count(): number {
    let count = this._count
    if (count == null)
      this._count = count = this._get_count()
    return count
  }

  protected _get_count(): number {
    const {_array, _nwords, size} = this
    let c = 0
    for (let k = 0, i = 0; i < _nwords; i++) {
      const word = _array[i]
      if (word == 0) {
        k += 32
      } else {
        for (let j = 0; j < 32 && k < size; j++, k++) {
          if ((word >>> j) & 0x1)
            c += 1
        }
      }
    }
    return c
  }

  *ones(): Iterable<number> {
    const {_array, _nwords, size} = this
    for (let k = 0, i = 0; i < _nwords; i++) {
      const word = _array[i]
      if (word == 0) {
        k += 32
        continue
      }
      for (let j = 0; j < 32 && k < size; j++, k++) {
        if ((word >>> j) & 0x1)
          yield k
      }
    }
  }

  *zeros(): Iterable<number> {
    const {_array, _nwords, size} = this
    for (let k = 0, i = 0; i < _nwords; i++) {
      const word = _array[i]
      if (word == 0xffffffff) {
        k += 32
        continue
      }
      for (let j = 0; j < 32 && k < size; j++, k++) {
        if (!((word >>> j) & 0x1))
          yield k
      }
    }
  }

  private _check_size(other: BitSet): void {
    assert(this.size == other.size, "Size mismatch")
  }

  add(other: BitSet): void {
    this._check_size(other)
    for (let i = 0; i < this._nwords; i++) {
      this._array[i] |= other._array[i]
    }
  }

  intersect(other: BitSet): void {
    this._check_size(other)
    for (let i = 0; i < this._nwords; i++) {
      this._array[i] &= other._array[i]
    }
  }

  subtract(other: BitSet): void {
    this._check_size(other)
    for (let i = 0; i < this._nwords; i++) {
      const a = this._array[i]
      const b = other._array[i]
      this._array[i] = (a ^ b) & a
    }
  }

  union(other: BitSet): BitSet {
    this._check_size(other)
    const result = this.clone()
    for (let i = 0; i < this._nwords; i++) {
      result._array[i] |= other._array[i]
    }
    return result
  }

  intersection(other: BitSet): BitSet {
    this._check_size(other)
    const result = this.clone()
    for (let i = 0; i < this._nwords; i++) {
      result._array[i] &= other._array[i]
    }
    return result
  }

  difference(other: BitSet): BitSet {
    this._check_size(other)
    const result = this.clone()
    for (let i = 0; i < this._nwords; i++) {
      const a = this._array[i]
      const b = other._array[i]
      result._array[i] = (a ^ b) & a
    }
    return result
  }

  select<T>(array: Arrayable<T>): Arrayable<T> {
    const n = this.count
    const result = new (array.constructor as ArrayableNew)<T>(n)
    let i = 0
    for (const j of this) {
      result[i++] = array[j]
    }
    return result
  }
}

export namespace Matrix {
  export type MapFn<T, U> = (value: T, row: number, col: number) => U
}

export class Matrix<T> {
  private _matrix: T[][]

  constructor(readonly nrows: number, readonly ncols: number, init: (row: number, col: number) => T) {
    this._matrix = new Array(nrows)
    for (let y = 0; y < nrows; y++) {
      this._matrix[y] = new Array(ncols)
      for (let x = 0; x < ncols; x++) {
        this._matrix[y][x] = init(y, x)
      }
    }
  }

  at(row: number, col: number): T {
    return this._matrix[row][col]
  }

  *[Symbol.iterator](): Iterator<[T, number, number]> {
    for (let y = 0; y < this.nrows; y++) {
      for (let x = 0; x < this.ncols; x++) {
        const value = this._matrix[y][x]
        yield [value, y, x]
      }
    }
  }

  *values(): Iterable<T> {
    for (const [item] of this) {
      yield item
    }
  }

  map<U>(fn: Matrix.MapFn<T, U>): Matrix<U> {
    return new Matrix<U>(this.nrows, this.ncols, (row, col) => fn(this.at(row, col), row, col))
  }

  apply<U>(obj: Matrix<Matrix.MapFn<T, U>> | Matrix.MapFn<T, U>[][]): Matrix<U> {
    const fn = Matrix.from(obj)

    const {nrows, ncols} = this
    if (nrows == fn.nrows && ncols == fn.ncols)
      return new Matrix(nrows, ncols, (row, col) => fn.at(row, col)(this.at(row, col), row, col))
    else
      throw new Error("dimensions don't match")
  }

  to_sparse(): [T, number, number][] {
    return [...this]
  }

  static from<U>(obj: U[], ncols: number): Matrix<U>
  static from<U>(obj: Matrix<U> | U[][]): Matrix<U>

  static from<U>(obj: Matrix<U> | U[][] | U[], ncols?: number): Matrix<U> {
    if (obj instanceof Matrix) {
      return obj
    } else if (ncols != null) {
      const entries = obj as U[]
      const nrows = Math.floor(entries.length/ncols)
      return new Matrix(nrows, ncols, (row, col) => entries[row*ncols + col])
    } else {
      const arrays = obj as U[][]
      const nrows = obj.length
      const ncols = min(arrays.map((row) => row.length))
      return new Matrix(nrows, ncols, (row, col) => arrays[row][col])
    }
  }
}
