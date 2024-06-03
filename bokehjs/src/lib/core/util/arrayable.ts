import type {Arrayable, ArrayableNew, FloatArray, TypedArray} from "../types"
import {clamp} from "./math"
import {assert, assert_debug} from "./assert"

const {floor} = Math

export function is_empty(array: Arrayable): boolean {
  return array.length == 0
}

export function is_sorted<T>(array: Arrayable<T>): boolean {
  const n = array.length
  if (n == 0) {
    return true
  }

  let prev = array[0]
  for (let i = 1; i < n; i++) {
    const curr = array[i]
    if (prev <= curr) {
      prev = curr
    } else {
      return false
    }
  }

  return true
}

export function copy<T>(array: T[]): T[]
export function copy<T>(array: Arrayable<T>): Arrayable<T>

export function copy<T>(array: Arrayable<T>): Arrayable<T> {
  if (Array.isArray(array)) {
    return array.slice()
  } else {
    return new (array.constructor as any)(array)
  }
}

export function splice<T>(array: T[], start: number, k?: number, ...items: T[]): T[]
export function splice<T>(array: Arrayable<T>, start: number, k?: number, ...items: T[]): Arrayable<T>

export function splice<T>(array: Arrayable<T>, start: number, k?: number, ...items: T[]): Arrayable<T> {
  if (Array.isArray(array)) {
    const result = copy(array)
    if (k === undefined) {
      result.splice(start)
    } else {
      result.splice(start, k, ...items)
    }
    return result
  }

  const len = array.length

  if (start < 0) {
    start += len
  }

  if (start < 0) {
    start = 0
  } else if (start > len) {
    start = len
  }

  if (k == null || k > len - start) {
    k = len - start
  } else if (k < 0) {
    k = 0
  }

  const n = len - k + items.length

  const result = new (array.constructor as ArrayableNew)<T>(n)

  let i = 0
  for (; i < start; i++) {
    result[i] = array[i]
  }

  for (const item of items) {
    result[i++] = item
  }

  for (let j = start + k; j < len; j++) {
    result[i++] = array[j]
  }

  return result
}

export function head<T>(array: T[], n: number): T[]
export function head<T>(array: Arrayable<T>, n: number): Arrayable<T>

export function head<T>(array: Arrayable<T>, n: number): Arrayable<T> {
  return splice(array, n, array.length - n)
}

export function insert<T>(array: T[], item: T, i: number): T[]
export function insert<T>(array: Arrayable<T>, item: T, i: number): Arrayable<T>

export function insert<T>(array: Arrayable<T>, item: T, i: number): Arrayable<T> {
  return splice(array, i, 0, item)
}

export function append<T>(array: T[], item: T): T[]
export function append<T>(array: Arrayable<T>, item: T): Arrayable<T>

export function append<T>(array: Arrayable<T>, item: T): Arrayable<T> {
  return splice(array, array.length, 0, item)
}

export function prepend<T>(array: T[], item: T): T[]
export function prepend<T>(array: Arrayable<T>, item: T): Arrayable<T>

export function prepend<T>(array: Arrayable<T>, item: T): Arrayable<T> {
  return splice(array, 0, 0, item)
}

export function index_of<T>(array: Arrayable<T>, item: T): number {
  return array.indexOf(item)
}

export function includes<T>(array: Arrayable<T>, value: T): boolean {
  return array.indexOf(value) !== -1
}

export const contains = includes

export function subselect<T>(array: Arrayable<T>, indices: Arrayable<number>): Arrayable<T> {
  const n = indices.length
  const result = new (array.constructor as ArrayableNew)<T>(n)
  for (let i = 0; i < n; i++) {
    result[i] = array[indices[i]]
  }
  return result
}

export function mul<T extends Arrayable<number>>(array: T, coeff: number, output?: T): T {
  const n = array.length
  const result: T = output ?? new (array.constructor as any)(n)
  for (let i = 0; i < n; i++) {
    result[i] = array[i]*coeff
  }
  return result
}

export function map(array: Float64Array, fn: (item: number, i: number, array: Float64Array) => number): Float64Array
export function map(array: Float32Array, fn: (item: number, i: number, array: Float32Array) => number): Float32Array
export function map(array: FloatArray, fn: (item: number, i: number, array: Float32Array) => number): FloatArray
export function map(array: TypedArray, fn: (item: number, i: number, array: Float32Array) => number): TypedArray
export function map<T, U>(array: T[], fn: (item: T, i: number, array: Arrayable<T>) => U): U[]
export function map<T, U>(array: Arrayable<T>, fn: (item: T, i: number, array: Arrayable<T>) => U): Arrayable<U>

export function map<T, U>(array: Arrayable<T>, fn: (item: T, i: number, array: any) => U): Arrayable<U> {
  const n = array.length
  const result = new (array.constructor as ArrayableNew)<U>(n)
  for (let i = 0; i < n; i++) {
    result[i] = fn(array[i], i, array)
  }
  return result
}

export function inplace_map<T>(array: Arrayable<T>, fn: (item: T, i: number) => T, output?: Arrayable<T>): void {
  const n = array.length
  const result = output ?? array
  for (let i = 0; i < n; i++) {
    result[i] = fn(array[i], i)
  }
}

export function filter<T>(array: T[], pred: (item: T, i: number, array: Arrayable<T>) => boolean): T[]
export function filter<T>(array: Arrayable<T>, pred: (item: T, i: number, array: Arrayable<T>) => boolean): Arrayable<T>

export function filter<T>(array: Arrayable<T>, pred: (item: T, i: number, array: Arrayable<T>) => boolean): Arrayable<T> {
  const n = array.length
  const result = new (array.constructor as ArrayableNew)<T>(n)
  let k = 0
  for (let i = 0; i < n; i++) {
    const value = array[i]
    if (pred(value, i, array)) {
      result[k++] = value
    }
  }
  return head(result, k)
}

export function reduce<T>(array: Arrayable<T>, fn: (previous: T, current: T, index: number, array: Arrayable<T>) => T, initial?: T): T {
  const n = array.length

  if (initial === undefined && n == 0) {
    throw new Error("can't reduce an empty array without an initial value")
  }

  let value: T
  let i: number

  if (initial === undefined) {
    value = array[0]
    i = 1
  } else {
    value = initial
    i = 0
  }

  for (; i < n; i++) {
    value = fn(value, array[i], i, array)
  }

  return value
}

export function sort_by<T>(array: T[], key: (item: T) => number): T[]
export function sort_by<T>(array: Arrayable<T>, key: (item: T) => number): Arrayable<T>

export function sort_by<T>(array: Arrayable<T>, key: (item: T) => number): Arrayable<T> {
  const tmp = Array.from(array, (value, index) => {
    return {index, key: key(value)}
  })
  tmp.sort((left, right) => {
    const a = left.key
    const b = right.key
    if (a !== b) {
      if (a > b) {
        return  1
      }
      if (a < b) {
        return -1
      }
    }
    return left.index - right.index
  })
  return map(array, (_, i) => array[tmp[i].index])
}

export function min(iterable: Iterable<number>): number {
  let result = Infinity

  for (const value of iterable) {
    if (!isNaN(value) && value < result) {
      result = value
    }
  }

  return result
}

export function max(iterable: Iterable<number>): number {
  let result = -Infinity

  for (const value of iterable) {
    if (!isNaN(value) && value > result) {
      result = value
    }
  }

  return result
}

export function minmax(iterable: Iterable<number>): [number, number] {
  let min = +Infinity
  let max = -Infinity

  for (const value of iterable) {
    if (!isNaN(value)) {
      if (value < min) {
        min = value
      }
      if (value > max) {
        max = value
      }
    }
  }

  return [min, max]
}

export function minmax2(arr: Arrayable<number>, brr: Arrayable<number>): [number, number, number, number] {
  let a: number
  let b: number
  let a_min = +Infinity
  let a_max = -Infinity
  let b_min = +Infinity
  let b_max = -Infinity

  const n = Math.min(arr.length, brr.length)
  for (let i = 0; i < n; i++) {
    a = arr[i]
    b = brr[i]
    if (!isNaN(a) && !isNaN(b)) {
      if (a < a_min) { a_min = a }
      if (a > a_max) { a_max = a }
      if (b < b_min) { b_min = b }
      if (b > b_max) { b_max = b }
    }
  }

  return [a_min, a_max, b_min, b_max]
}

export function min_by<T>(array: Arrayable<T>, key: (item: T, i: number) => number): T {
  if (array.length == 0) {
    throw new Error("min_by() called with an empty array")
  }

  let result = array[0]
  let result_computed = key(result, 0)

  for (let i = 1, length = array.length; i < length; i++) {
    const value = array[i]
    const computed = key(value, i)
    if (computed < result_computed) {
      result = value
      result_computed = computed
    }
  }

  return result
}

export function max_by<T>(array: Arrayable<T>, key: (item: T, i: number) => number): T {
  if (array.length == 0) {
    throw new Error("max_by() called with an empty array")
  }

  let result = array[0]
  let result_computed = key(result, 0)

  for (let i = 1, length = array.length; i < length; i++) {
    const value = array[i]
    const computed = key(value, i)
    if (computed > result_computed) {
      result = value
      result_computed = computed
    }
  }

  return result
}

export function sum(array: Arrayable<number>): number {
  let result = 0
  for (let i = 0, n = array.length; i < n; i++) {
    result += array[i]
  }
  return result
}

export function cumsum(array: number[]): number[]
export function cumsum(array: Arrayable<number>): Arrayable<number>

export function cumsum(array: Arrayable<number>): Arrayable<number> {
  const result = new (array.constructor as ArrayableNew)<number>(array.length)
  reduce(array, (a, b, i) => result[i] = a + b, 0)
  return result
}

export function every<T>(iter: Iterable<T>, predicate: (item: T) => boolean): boolean {
  for (const item of iter) {
    if (!predicate(item)) {
      return false
    }
  }
  return true
}

export function some<T>(iter: Iterable<T>, predicate: (item: T) => boolean): boolean {
  for (const item of iter) {
    if (predicate(item)) {
      return true
    }
  }
  return false
}

function _find_index(dir: -1 | 1) {
  return function<T>(array: Arrayable<T>, predicate: (item: T) => boolean): number {
    const length = array.length
    let index = dir > 0 ? 0 : length - 1
    for (; index >= 0 && index < length; index += dir) {
      if (predicate(array[index])) {
        return index
      }
    }
    return -1
  }
}

export const find_index = _find_index(1)
export const find_last_index = _find_index(-1)

export function find<T>(array: Arrayable<T>, predicate: (item: T) => boolean): T | undefined {
  const index = find_index(array, predicate)
  return index == -1 ? undefined : array[index]
}

export function find_last<T>(array: Arrayable<T>, predicate: (item: T) => boolean): T | undefined {
  const index = find_last_index(array, predicate)
  return index == -1 ? undefined : array[index]
}

export function bisect_left_by<T, U>(array: Arrayable<T>, value: U, fn: (item: T) => U, low: number = 0, high: number = array.length): number {
  assert_debug(() => is_sorted(array))
  assert(0 <= low && high <= array.length)
  while (low < high) {
    const mid = floor((low + high) / 2)
    if (fn(array[mid]) < value) {
      low = mid + 1
    } else {
      high = mid
    }
  }
  return low
}

export function bisect_right_by<T, U>(array: Arrayable<T>, value: U, fn: (item: T) => U, low: number = 0, high: number = array.length): number {
  assert_debug(() => is_sorted(array))
  assert(0 <= low && high <= array.length)
  while (low < high) {
    const mid = floor((low + high) / 2)
    if (fn(array[mid]) <= value) {
      low = mid + 1
    } else {
      high = mid
    }
  }
  return low
}

export function bisect_left<T>(array: Arrayable<T>, value: T, low: number = 0, high?: number): number {
  return bisect_left_by(array, value, (item) => item, low, high)
}

export function bisect_right<T>(array: Arrayable<T>, value: T, low: number = 0, high?: number): number {
  return bisect_right_by(array, value, (item) => item, low, high)
}

export function binary_search<T>(array: Arrayable<T>, value: T): number | null {
  const i = bisect_left(array, value)
  return i != array.length && array[i] == value ? i : null
}

export const sorted_index = bisect_left

export function bin_counts(data: Arrayable<number>, bin_edges: Arrayable<number>): Arrayable<number> {
  const nbins = bin_edges.length - 1
  const counts = Array(nbins).fill(0)
  for (let i = 0; i < data.length; i++) {
    const sample = data[i]
    const index = sorted_index(bin_edges, sample)
    const bin = clamp(index - 1, 0, nbins - 1)
    counts[bin] += 1
  }
  return counts
}

export function interpolate(points: Arrayable<number>, x_values: Arrayable<number>, y_values: Arrayable<number>): Arrayable<number> {
  // Implementation ported from np.interp

  const n = points.length
  const results: number[] = new Array(n)

  for (let i = 0; i < n; i++) {
    const point = points[i]

    if (isNaN(point) || x_values.length == 0) {
      results[i] = NaN
      continue
    }

    const index = left_edge_index(point, x_values)
    if (index == -1) {
      results[i] = y_values[0]
    } else if (index == x_values.length) {
      results[i] = y_values[y_values.length-1]
    } else if (index == x_values.length-1 || x_values[index] == point) {
      results[i] = y_values[index]
    } else {
      const x0 = x_values[index]
      const y0 = y_values[index]
      const x1 = x_values[index + 1]
      const y1 = y_values[index + 1]
      results[i] = lerp(point, x0, y0, x1, y1)
    }
  }
  return results
}

function lerp(x: number, x0: number, y0: number, x1: number, y1: number): number {
  const slope = (y1 - y0)/(x1 - x0)
  let res = slope*(x-x0) + y0
  if (!isFinite(res)) {
    res = slope*(x-x1) + y1
    if (!isFinite(res) && (y0 == y1)) {
      res = y0
    }
  }
  return res
}

export function left_edge_index(point: number, intervals: Arrayable<number>): number {
  if (point < intervals[0]) {
    return -1
  }
  if (point > intervals[intervals.length - 1]) {
    return intervals.length
  }
  if (intervals.length == 1) {
    // Implies point == intervals[0]
    return 0
  }
  let leftEdgeIndex = 0
  let rightEdgeIndex = intervals.length - 1
  while (rightEdgeIndex - leftEdgeIndex != 1) {
    const indexOfNumberToCompare = leftEdgeIndex + Math.floor((rightEdgeIndex - leftEdgeIndex)/2)
    if (point >= intervals[indexOfNumberToCompare]) {
      leftEdgeIndex = indexOfNumberToCompare
    } else {
      rightEdgeIndex = indexOfNumberToCompare
    }
  }
  return leftEdgeIndex
}

export function norm(array: Arrayable<number>, start: number, end: number): Arrayable<number> {
  const span = end - start
  return map(array, (x) => (x - start) / span)
}
