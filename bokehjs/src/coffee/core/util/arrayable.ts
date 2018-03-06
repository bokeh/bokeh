import {Arrayable} from "../types"

export function map<T, U>(array: Arrayable<T>, fn: (item: T) => U): Arrayable<U> {
  const n = array.length
  const result: Arrayable<U> = new (array.constructor as any)(n)
  for (let i = 0; i < n; i++) {
    result[i] = fn(array[i])
  }
  return result
}
