//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

import {randomIn} from "./math"
import {assert} from "./assert"

import {map, reduce, min, min_by, max, max_by, sum, cumsum, every, some, find, find_last, find_index, find_last_index, sorted_index, is_empty} from "./arrayable"
export {map, reduce, min, min_by, max, max_by, sum, cumsum, every, some, find, find_last, find_index, find_last_index, sorted_index, is_empty}

const slice = Array.prototype.slice

export function head<T>(array: T[]): T {
  return array[0]
}

export function tail<T>(array: T[]): T {
  return array[array.length-1]
}

export function last<T>(array: T[]): T {
  return array[array.length-1]
}

export function copy<T>(array: T[]): T[] {
  return slice.call(array)
}

export function concat<T>(arrays: T[][]): T[] {
  return ([] as T[]).concat(...arrays)
}

export function includes<T>(array: T[], value: T): boolean {
  return array.indexOf(value) !== -1
}

export const contains = includes

export function nth<T>(array: T[], index: number): T {
  return array[index >= 0 ? index : array.length + index]
}

export function zip<A, B>(As: A[], Bs: B[]): [A, B][]
export function zip<A, B, C>(As: A[], Bs: B[], Cs: C[]): [A, B, C][]
export function zip<T>(...arrays: T[][]): T[][]
export function zip(...arrays: unknown[][]): unknown[][] {
  if (arrays.length == 0)
    return []

  const n = min(arrays.map((a) => a.length))
  const k = arrays.length

  const result: unknown[][] = new Array(n)

  for (let i = 0; i < n; i++) {
    result[i] = new Array(k)
    for (let j = 0; j < k; j++)
      result[i][j] = arrays[j][i]
  }

  return result
}

export function unzip<A, B>(ABs: [A, B][]): [A[], B[]]
export function unzip<A, B, C>(ABCs: [A, B, C][]): [A[], B[], C[]]
export function unzip<T>(arrays: T[][]): T[][]
export function unzip(array: unknown[][]): unknown[][] {
  const n = array.length
  const k = min(array.map((a) => a.length))

  const results: unknown[][] = Array(k)
  for (let j = 0; j < k; j++)
    results[j] = new Array(n)

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < k; j++)
      results[j][i] = array[i][j]
  }

  return results
}

export function range(start: number, stop?: number, step: number = 1): number[] {
  assert(step > 0, "'step' must be a positive number")

  if (stop == null) {
    stop = start
    start = 0
  }

  const {max, ceil, abs} = Math

  const delta = start <= stop ? step : -step
  const length = max(ceil(abs(stop - start) / step), 0)
  const range = new Array(length)

  for (let i = 0; i < length; i++, start += delta) {
    range[i] = start
  }

  return range
}

export function linspace(start: number, stop: number, num: number = 100): number[] {
  const step = (stop - start) / (num - 1)
  const array = new Array(num)

  for (let i = 0; i < num; i++) {
    array[i] = start + step*i
  }

  return array
}

export function transpose<T>(array: T[][]): T[][] {
  const rows = array.length
  const cols = array[0].length

  const transposed: T[][] = []

  for (let j = 0; j < cols; j++) {
    transposed[j] = []

    for (let i = 0; i < rows; i++) {
      transposed[j][i] = array[i][j]
    }
  }

  return transposed
}

export function argmin(array: number[]): number {
  return min_by(range(array.length), (i) => array[i])
}

export function argmax(array: number[]): number {
  return max_by(range(array.length), (i) => array[i])
}

export function sort_by<T>(array: T[], key: (item: T) => number): T[] {
  const tmp = array.map((value, index) => {
    return {value, index, key: key(value) }
  })
  tmp.sort((left, right) => {
    const a = left.key
    const b = right.key
    if (a !== b) {
      if (a > b || a === undefined) return  1
      if (a < b || b === undefined) return -1
    }
    return left.index - right.index
  })
  return tmp.map((item) => item.value)
}

export function uniq<T>(array: T[]): T[] {
  const result = new Set<T>()
  for (const value of array) {
    result.add(value)
  }
  return [...result]
}

export function uniq_by<T, U>(array: T[], key: (item: T) => U): T[] {
  const result: T[] = []
  const seen: U[] = []
  for (const value of array) {
    const computed = key(value)
    if (!includes(seen, computed)) {
      seen.push(computed)
      result.push(value)
    }
  }
  return result
}

export function union<T>(...arrays: T[][]): T[] {
  const result = new Set<T>()
  for (const array of arrays) {
    for (const value of array) {
      result.add(value)
    }
  }
  return [...result]
}

export function intersection<T>(array: T[], ...arrays: T[][]): T[] {
  const result: T[] = []
  top: for (const item of array) {
    if (includes(result, item))
      continue
    for (const other of arrays) {
      if (!includes(other, item))
        continue top
    }
    result.push(item)
  }
  return result
}

export function difference<T>(array: T[], ...arrays: T[][]): T[] {
  const rest = concat(arrays)
  return array.filter((value) => !includes(rest, value))
}

export function remove_at<T>(array: T[], i: number): T[] {
  const result = copy(array)
  result.splice(i, 1)
  return result
}

export function remove_by<T>(array: T[], key: (item: T) => boolean): void {
  for (let i = 0; i < array.length;) {
    if (key(array[i]))
      array.splice(i, 1)
    else
      i++
  }
}

// Shuffle a collection, using the modern version of the
// [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
export function shuffle<T>(array: T[]): T[] {
  const length = array.length
  const shuffled = new Array(length)
  for (let i = 0; i < length; i++) {
    const rand = randomIn(0, i)
    if (rand !== i)
      shuffled[i] = shuffled[rand]
    shuffled[rand] = array[i]
  }
  return shuffled
}

export function pairwise<T, U>(array: T[], fn: (prev: T, next: T) => U): U[] {
  const n = array.length
  const result: U[] = new Array(n-1)

  for (let i = 0; i < n - 1; i++) {
    result[i] = fn(array[i], array[i+1])
  }

  return result
}

export function reversed<T>(array: T[]): T[] {
  const n = array.length
  const result: T[] = new Array(n)

  for (let i = 0; i < n; i++) {
    result[n - i - 1] = array[i]
  }

  return result
}

export function repeat<T>(value: T, n: number): T[] {
  const result: T[] = new Array(n)
  for (let i = 0; i < n; i++) {
    result[i] = value
  }
  return result
}
