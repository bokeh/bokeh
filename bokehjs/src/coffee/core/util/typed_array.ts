import {TypedArray} from "../types"

export function concat<T extends TypedArray>(array0: T, ...arrays: T[]): T {
  let n = array0.length
  for (const array of arrays)
    n += array.length

  const result = new array0.constructor(n) as T
  result.set(array0, 0)

  let i = array0.length
  for (const array of arrays) {
    result.set(array, i)
    i += array.length
  }

  return result
}
