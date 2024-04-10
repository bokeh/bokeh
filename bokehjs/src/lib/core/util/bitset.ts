import type {Equatable, Comparator} from "./eq"
import {equals} from "./eq"
import type {Arrayable, ArrayableNew, Indices} from "../types"
import {assert, AssertionError} from "./assert"
import {has_refs} from "core/util/refs"

const WORD_LENGTH = 32
const FULL_WORD = 0xffffffff

export class BitSet implements Indices, Equatable {
  readonly [Symbol.toStringTag] = "BitSet"

  static readonly [has_refs] = false

  private readonly _array: Uint32Array
  private readonly _nwords: number

  constructor(readonly size: number, init: Uint32Array | 1 | 0 = 0, count?: number) {
    this._nwords = Math.ceil(size/WORD_LENGTH)
    if (init == 0 || init == 1) {
      this._array = new Uint32Array(this._nwords)
      if (init == 1) {
        this._array.fill(0xffffffff)
        this._count = size
      } else {
        this._count = 0
      }
    } else {
      assert(init.length == this._nwords, "Initializer size mismatch")
      this._array = init
      if (count != null) {
        this._count = count
      } else {
        this._update_count()
      }
    }
    this._clear_trailing()
  }

  clone(): BitSet {
    return new BitSet(this.size, new Uint32Array(this._array), this._count)
  }

  [equals](that: this, cmp: Comparator): boolean {
    if (!cmp.eq(this.size, that.size)) {
      return false
    }
    const {_nwords} = this
    const trailing = this.size % WORD_LENGTH
    const n = trailing == 0 ? _nwords : _nwords - 1
    for (let i = 0; i < n; i++) {
      if (this._array[i] != that._array[i]) {
        return false
      }
    }
    if (trailing == 0) {
      return true
    } else {
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

  static from_indices(size: number, indices: Iterable<number>): BitSet {
    const bits = new BitSet(size)
    for (const i of indices) {
      bits.set(i)
    }
    return bits
  }

  static from_booleans(size: number, booleans: Iterable<boolean>): BitSet {
    const bits = new BitSet(size)
    let i = 0
    for (const boolean of booleans) {
      if (i == size) {
        break
      }
      if (boolean) {
        bits.set(i)
      }
      i += 1
    }
    return bits
  }

  get(k: number): boolean {
    this._check_bounds(k)
    const i = k >>> 5  // Math.floor(k/32)
    const j = k & 0x1f // k % 32
    const bit = 0b1 << j
    const is_set = (this._array[i] & bit) != 0
    return is_set
  }

  set(k: number, v: boolean = true): void {
    this._check_bounds(k)
    const i = k >>> 5  // Math.floor(k/32)
    const j = k & 0x1f // k % 32
    const bit = 0b1 << j
    const is_set = (this._array[i] & bit) != 0
    if (v) {
      if (!is_set) {
        this._count++
      }
      this._array[i] |= bit
    } else {
      if (is_set) {
        this._count--
      }
      this._array[i] &= ~bit
    }
  }

  unset(k: number): void {
    this.set(k, false)
  }

  *[Symbol.iterator](): Iterator<number> {
    yield* this.ones()
  }

  private _count: number
  get count(): number {
    return this._count
  }

  protected _bit_count(i: number): number {
    // https://stackoverflow.com/questions/109023/count-the-number-of-set-bits-in-a-32-bit-integer/109025#109025
    i = i | 0                                        // convert to an integer
    i = i - ((i >>> 1) & 0x55555555)                 // add pairs of bits
    i = (i & 0x33333333) + ((i >>> 2) & 0x33333333)  // quads
    i = (i + (i >>> 4)) & 0x0f0f0f0f                 // groups of 8
    i *= 0x01010101                                  // horizontal sum of bytes
    return i >>> 24                                  // return just that top byte (after truncating to 32-bit even when int is wider than uint32_t)
  }

  protected _get_count(): number {
    const {_array, _nwords, size} = this
    let c = 0
    for (let k = 0, i = 0; i < _nwords; i++) {
      const word = _array[i]
      if (word == 0) {
        continue
      } else if (word == FULL_WORD) {
        c += WORD_LENGTH
      } else {
        for (let j = 0; j < WORD_LENGTH && k < size; j++, k++) {
          if (((word >>> j) & 0b1) == 0b1) {
            c += 1
          }
        }
        //c += this._bit_count(word)
      }
    }
    return c
  }

  protected _update_count(): void {
    this._count = this._get_count()
  }

  protected _clear_trailing(): void {
    const {_nwords} = this
    const trailing = this.size % WORD_LENGTH
    const n = trailing == 0 ? _nwords : _nwords - 1
    const msb = 1 << (trailing - 1)
    const mask = (msb - 1)^msb
    this._array[n] &= mask
  }

  ones(): number[] {
    const indices = new Array(this.count)
    let index = 0
    const {_array, _nwords, size} = this
    for (let k = 0, i = 0; i < _nwords; i++) {
      const word = _array[i]
      if (word == 0) {
        k += WORD_LENGTH
        continue
      }
      for (let j = 0; j < WORD_LENGTH && k < size; j++, k++) {
        if (((word >>> j) & 0b1) == 0b1) {
          indices[index++] = k
        }
      }
    }
    return indices
  }

  zeros(): number[] {
    const indices = new Array(this.size - this.count)
    let index = 0
    const {_array, _nwords, size} = this
    for (let k = 0, i = 0; i < _nwords; i++) {
      const word = _array[i]
      if (word == FULL_WORD) {
        k += WORD_LENGTH
        continue
      }
      for (let j = 0; j < WORD_LENGTH && k < size; j++, k++) {
        if (((word >>> j) & 0b1) == 0b0) {
          indices[index++] = k
        }
      }
    }
    return indices
  }

  invert(): void {
    for (let i = 0; i < this._nwords; i++) {
      this._array[i] = ~this._array[i] >>> 0
    }
    this._update_count()
  }

  add(other: BitSet): void {
    this._check_size(other)
    for (let i = 0; i < this._nwords; i++) {
      this._array[i] |= other._array[i]
    }
    this._update_count()
  }

  intersect(other: BitSet): void {
    this._check_size(other)
    for (let i = 0; i < this._nwords; i++) {
      this._array[i] &= other._array[i]
    }
    this._update_count()
  }

  subtract(other: BitSet): void {
    this._check_size(other)
    for (let i = 0; i < this._nwords; i++) {
      const a = this._array[i]
      const b = other._array[i]
      this._array[i] = (a ^ b) & a
    }
    this._update_count()
  }

  symmetric_subtract(other: BitSet): void {
    this._check_size(other)
    for (let i = 0; i < this._nwords; i++) {
      this._array[i] ^= other._array[i]
    }
    this._update_count()
  }

  inversion(): BitSet {
    const result = this.clone()
    result.invert()
    return result
  }

  union(other: BitSet): BitSet {
    const result = this.clone()
    result.add(other)
    return result
  }

  intersection(other: BitSet): BitSet {
    const result = this.clone()
    result.intersect(other)
    return result
  }

  difference(other: BitSet): BitSet {
    const result = this.clone()
    result.subtract(other)
    return result
  }

  symmetric_difference(other: BitSet): BitSet {
    const result = this.clone()
    result.symmetric_subtract(other)
    return result
  }

  select<T>(array: Arrayable<T>): Arrayable<T> {
    this._check_array_length(array)
    const n = this.count
    if (n == this.size) {
      return array.slice()
    } else {
      const result = new (array.constructor as ArrayableNew)<T>(n)
      let i = 0
      for (const j of this) {
        result[i++] = array[j]
      }
      return result
    }
  }

  protected _check_bounds(k: number): void {
    if (!(0 <= k && k < this.size)) {
      throw new AssertionError(`Out of bounds: 0 <= ${k} < ${this.size}`)
    }
  }

  protected _check_size(other: BitSet): void {
    if (this.size != other.size) {
      throw new AssertionError(`Size mismatch (${this.size} != ${other.size})`)
    }
  }

  protected _check_array_length(other: Arrayable) {
    if (!(this.size <= other.length)) {
      throw new AssertionError(`Size mismatch (${this.size} != ${other.length})`)
    }
  }
}
