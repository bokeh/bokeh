//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

import {randomIn} from "./math"
import {assert} from "./assert"

import {min, minBy, max, maxBy, sum} from "./arrayable"
export {min, minBy, max, maxBy, sum}

const slice = Array.prototype.slice

export function head<T>(array: T[]): T {
  return array[0]
}

export function tail<T>(array: T[]): T {
  return array[array.length-1]
}

export function last<T>(array: T[]): T | undefined {
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

export function zip<A, B>(As: A[], Bs: B[]): [A, B][] {
  const n = Math.min(As.length, Bs.length)
  const ABs: [A, B][] = new Array(n)
  for (let i = 0; i < n; i++) {
    ABs[i] = [As[i], Bs[i]]
  }
  return ABs
}

export function unzip<A, B>(ABs: [A, B][]): [A[], B[]] {
  const n = ABs.length
  const As: A[] = new Array(n)
  const Bs: B[] = new Array(n)
  for (let i = 0; i < n; i++) {
    [As[i], Bs[i]] = ABs[i]
  }
  return [As, Bs]
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
  const range = Array(length)

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

export function cumsum(array: number[]): number[] {
  const result: number[] = []
  array.reduce((a, b, i) => result[i] = a + b, 0)
  return result
}

export function argmin(array: number[]): number {
  return minBy(range(array.length), (i) => array[i])
}

export function argmax(array: number[]): number {
  return maxBy(range(array.length), (i) => array[i])
}

export function all<T>(array: T[], predicate: (item: T) => boolean): boolean {
  for (const item of array) {
    if (!predicate(item))
      return false
  }
  return true
}

export function any<T>(array: T[], predicate: (item: T) => boolean): boolean {
  for (const item of array) {
    if (predicate(item))
      return true
  }
  return false
}

function findIndexFactory(dir: number) {
  return function<T>(array: T[], predicate: (item: T) => boolean): number {
    const length = array.length
    let index = dir > 0 ? 0 : length - 1
    for (; index >= 0 && index < length; index += dir) {
      if (predicate(array[index]))
        return index
    }
    return -1
  }
}

export const findIndex = findIndexFactory(1)
export const findLastIndex = findIndexFactory(-1)

export function find<T>(array: T[], predicate: (item: T) => boolean): T | undefined {
  const index = findIndex(array, predicate)
  return index == -1 ? undefined : array[index]
}

export function findLast<T>(array: T[], predicate: (item: T) => boolean): T | undefined {
  const index = findLastIndex(array, predicate)
  return index == -1 ? undefined : array[index]
}

export function sortedIndex<T>(array: T[], value: T): number {
  let low = 0
  let high = array.length
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if (array[mid] < value)
      low = mid + 1
    else
      high = mid
  }
  return low
}

export function sortBy<T>(array: T[], key: (item: T) => number): T[] {
  const tmp = array.map((value, index) => {
    return {value: value, index: index, key: key(value) }
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
  const result = []
  for (const value of array) {
    if (!includes(result, value)) {
      result.push(value)
    }
  }
  return result
}

export function uniqBy<T, U>(array: T[], key: (item: T) => U): T[] {
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
  return uniq(concat(arrays))
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

export function removeBy<T>(array: T[], key: (item: T) => boolean): void {
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
