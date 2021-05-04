import {Indices, Arrayable} from "./types"
import {equals, Equatable, Comparator} from "./util/eq"

export abstract class Uniform<T = number> implements Equatable {
  readonly is_scalar: boolean
  readonly length: number
  abstract get(i: number): T
  abstract [Symbol.iterator](): Generator<T, void, undefined>
  abstract select(indices: Indices): Uniform<T>
  abstract [equals](that: this, cmp: Comparator): boolean

  is_Scalar(): this is UniformScalar<T> { return this.is_scalar }
  is_Vector(): this is UniformVector<T> { return !this.is_scalar }
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
}

export class UniformVector<T> extends Uniform<T> {
  override readonly is_scalar = false
  override readonly length = this.array.length

  constructor(readonly array: Arrayable<T>) {
    super()
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
    for (let i = 0; i < n; i++)
      yield this.get(i)
  }
}
