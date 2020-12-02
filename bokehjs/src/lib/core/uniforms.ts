import {Indices, Arrayable} from "./types"

export abstract class Uniform<T = number> {
  readonly is_scalar: boolean
  readonly length: number
  abstract get(i: number): T
  abstract [Symbol.iterator](): Generator<T, void, undefined>
  abstract select(indices: Indices): Uniform<T>
}

export class UniformScalar<T> extends Uniform<T> {
  is_scalar = true

  constructor(readonly value: T, readonly length: number) {
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
}

export class UniformVector<T> extends Uniform<T> {
  is_scalar = false
  length = this.array.length

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
    return new UniformVector(array)
  }
}
