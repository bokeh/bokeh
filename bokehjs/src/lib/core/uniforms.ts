import type {Indices, Arrayable} from "./types"
import type {Equatable, Comparator} from "./util/eq"
import {equals} from "./util/eq"
import * as arrayable from  "./util/arrayable"

export abstract class Uniform<T = number> implements Equatable {
  abstract readonly is_scalar: boolean
  abstract readonly length: number
  abstract get(i: number): T
  abstract [Symbol.iterator](): Generator<T, void, undefined>
  abstract select(indices: Indices): Uniform<T>
  abstract [equals](that: this, cmp: Comparator): boolean
  abstract map<U>(fn: (v: T) => U): Uniform<U>

  is_Scalar(): this is UniformScalar<T> {
    return this.is_scalar
  }
  is_Vector(): this is UniformVector<T> {
    return !this.is_scalar
  }
}

export class UniformScalar<T> extends Uniform<T> {
  override readonly is_scalar = true

  constructor(readonly value: T, override readonly length: number) {
    super()
  }

  get(_i: number): T {
    return this.value
  }

  *[Symbol.iterator](): Generator<T, void, undefined> {
    const {length, value} = this
    for (let i = 0; i < length; i++) {
      yield value
    }
  }

  select(indices: Indices): UniformScalar<T> {
    return new UniformScalar(this.value, indices.count)
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.length, that.length) && cmp.eq(this.value, that.value)
  }

  map<U>(fn: (v: T) => U): UniformScalar<U> {
    return new UniformScalar(fn(this.value), this.length)
  }
}

export class UniformVector<T> extends Uniform<T> {
  override readonly is_scalar = false
  override readonly length: number

  constructor(readonly array: Arrayable<T>) {
    super()
    this.length = this.array.length
  }

  get(i: number): T {
    return this.array[i]
  }

  *[Symbol.iterator](): Generator<T, void, undefined> {
    yield* this.array
  }

  select(indices: Indices): UniformVector<T> {
    const array = indices.select(this.array)
    return new (this.constructor as any)(array)
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.length, that.length) && cmp.eq(this.array, that.array)
  }

  map<U>(fn: (v: T) => U): UniformVector<U> {
    return new UniformVector(arrayable.map(this.array, fn))
  }
}

export class ColorUniformVector extends UniformVector<number> {
  private readonly _view: DataView

  constructor(override readonly array: Uint32Array) {
    super(array)
    this._view = new DataView(array.buffer)
  }

  override get(i: number): number {
    return this._view.getUint32(4*i)
  }

  override *[Symbol.iterator](): Generator<number, void, undefined> {
    const n = this.length
    for (let i = 0; i < n; i++) {
      yield this.get(i)
    }
  }
}

export function min(u: Uniform<number>): number {
  return u.is_Scalar() ? u.value : arrayable.min((u as UniformVector<number>).array)
}

export function max(u: Uniform<number>): number {
  return u.is_Scalar() ? u.value : arrayable.max((u as UniformVector<number>).array)
}

export function some<T>(u: Uniform<T>, predicate: (item: T) => boolean): boolean {
  return u.is_Scalar() ? predicate(u.value) : arrayable.some((u as UniformVector<T>).array, predicate)
}

export function every<T>(u: Uniform<T>, predicate: (item: T) => boolean): boolean {
  return u.is_Scalar() ? predicate(u.value) : arrayable.every((u as UniformVector<T>).array, predicate)
}
