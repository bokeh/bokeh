import {Arrayable} from "../types"

export function splice<T>(array: Arrayable<T>, start: number, k?: number, ...items: T[]): Arrayable<T> {
  const len = array.length

  if (start < 0)
    start += len

  if (start < 0)
    start = 0
  else if (start > len)
    start = len

  if (k == null || k > len - start)
    k = len - start
  else if (k < 0)
    k = 0

  const n = len - k + items.length

  const result = new (array.constructor as any)(n) as Arrayable<T>

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

export function insert<T>(array: Arrayable<T>, item: T, i: number): Arrayable<T> {
  return splice(array, i, 0, item)
}

export function append<T>(array: Arrayable<T>, item: T): Arrayable<T> {
  return splice(array, array.length, 0, item)
}

export function prepend<T>(array: Arrayable<T>, item: T): Arrayable<T> {
  return splice(array, 0, 0, item)
}

export function indexOf<T>(array: Arrayable<T>, item: T): number {
  for (let i = 0, n = array.length; i < n; i++) {
    if (array[i] === item)
      return i
  }

  return -1
}

export function map<T, U>(array: Arrayable<T>, fn: (item: T, i: number, array: Arrayable<T>) => U): Arrayable<U> {
  const n = array.length
  const result: Arrayable<U> = new (array.constructor as any)(n)
  for (let i = 0; i < n; i++) {
    result[i] = fn(array[i], i, array)
  }
  return result
}

export function min(array: Arrayable<number>): number {
  let value: number
  let result = Infinity

  for (let i = 0, length = array.length; i < length; i++) {
    value = array[i]
    if (value < result) {
      result = value
    }
  }

  return result
}

export function min_by<T>(array: Arrayable<T>, key: (item: T) => number): T {
  if (array.length == 0)
    throw new Error("min_by() called with an empty array")

  let result = array[0]
  let resultComputed = key(result)

  for (let i = 1, length = array.length; i < length; i++) {
    const value = array[i]
    const computed = key(value)
    if (computed < resultComputed) {
      result = value
      resultComputed = computed
    }
  }

  return result
}

export function max(array: Arrayable<number>): number {
  let value: number
  let result = -Infinity

  for (let i = 0, length = array.length; i < length; i++) {
    value = array[i]
    if (value > result) {
      result = value
    }
  }

  return result
}

export function max_by<T>(array: Arrayable<T>, key: (item: T) => number): T {
  if (array.length == 0)
    throw new Error("max_by() called with an empty array")

  let result = array[0]
  let resultComputed = key(result)

  for (let i = 1, length = array.length; i < length; i++) {
    const value = array[i]
    const computed = key(value)
    if (computed > resultComputed) {
      result = value
      resultComputed = computed
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

export function every<T>(array: Arrayable<T>, predicate: (item: T) => boolean): boolean {
  for (let i = 0, length = array.length; i < length; i++) {
    if (!predicate(array[i]))
      return false
  }
  return true
}

export function some<T>(array: Arrayable<T>, predicate: (item: T) => boolean): boolean {
  for (let i = 0, length = array.length; i < length; i++) {
    if (predicate(array[i]))
      return true
  }
  return false
}

export function index_of<T>(array: Arrayable<T>, value: T): number {
  for (let i = 0, length = array.length; i < length; i++) {
    if (array[i] === value)
      return i
  }
  return -1
}

function _find_index(dir: -1 | 1) {
  return function<T>(array: Arrayable<T>, predicate: (item: T) => boolean): number {
    const length = array.length
    let index = dir > 0 ? 0 : length - 1
    for (; index >= 0 && index < length; index += dir) {
      if (predicate(array[index]))
        return index
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

export function sorted_index<T>(array: Arrayable<T>, value: T): number {
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

export function bin_counts(data : Arrayable<number>, bin_edges : Arrayable<number>) {
    const counts = Array(bin_edges.length -1).fill(0)
    for (let i = 0; i < data.length; i++){
        const sample = data[i]
        for (let bin = 0; bin < counts.length; bin++){
            if(sample > bin_edges[bin] && sample <= bin_edges[bin+1]){
                counts[bin]+=1
            }
        }
    }
    return counts
}

export function interp (pointsToEvaluate: number[], functionValuesX: Arrayable<number>, functionValuesY: Arrayable<number>) : number[] {
    const results : number[] = [] 
    pointsToEvaluate.forEach(function (point: number) {
    let index = leftedgeindex(point, functionValuesX)
    if (index == functionValuesX.length - 1)
      index--
    results.push(lerp(point, functionValuesX[index], functionValuesY[index]
      , functionValuesX[index + 1], functionValuesY[index + 1]))
  })
  return results
}

function lerp (x :number, x0:number, y0 :number,
                              x1:number, y1:number) :number {
  const a = (y1 - y0) / (x1 - x0)
  const b = -a * x0 + y0
  return a * x + b
}

function leftedgeindex(point : number, intervals: Arrayable<number>) :number {
  if (point < intervals[0])
    return 0
  if (point > intervals[intervals.length - 1])
    return intervals.length - 1
  let indexOfNumberToCompare 
    , leftEdgeIndex = 0
    , rightEdgeIndex = intervals.length - 1
  while (rightEdgeIndex - leftEdgeIndex !== 1) {
    indexOfNumberToCompare = leftEdgeIndex + Math.floor((rightEdgeIndex - leftEdgeIndex)/2)
    point >= intervals[indexOfNumberToCompare]
      ? leftEdgeIndex = indexOfNumberToCompare
      : rightEdgeIndex = indexOfNumberToCompare
  }
  return leftEdgeIndex
}
