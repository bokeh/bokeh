//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

const slice = Array.prototype.slice

export function copy<T>(array: Array<T> /*| TypedArray*/): Array<T> {
  return slice.call(array)
}

export function concat<T>(arrays: Array<Array<T>>): Array<T> {
  return [].concat(...arrays)
}

export function contains<T>(array: Array<T>, value: T): boolean {
  return array.indexOf(value) >= 0
}

export function nth<T>(array: Array<T>, index: number): T {
  return array[index >= 0 ? index : array.length + index]
}

export function zip<A, B>(As: Array<A>, Bs: Array<B>): Array<[A, B]> {
  const n = Math.min(As.length, Bs.length)
  const ABs = new Array<[A, B]>(n)
  for (let i = 0; i < n; i++) {
    ABs[i] = [As[i], Bs[i]]
  }
  return ABs
}

export function unzip<A, B>(ABs: Array<[A, B]>): [Array<A>, Array<B>] {
  const n = ABs.length
  const As = new Array<A>(n)
  const Bs = new Array<B>(n)
  for (let i = 0; i < n; i++) {
    [As[i], Bs[i]] = ABs[i]
  }
  return [As, Bs]
}

export function range(start: number, stop?: number, step: number = 1): Array<number> {
  if (stop == null) {
    stop = start
    start = 0
  }

  const length = Math.max(Math.ceil((stop - start) / step), 0)
  const range = Array(length)

  for (let i = 0; i < length; i++, start += step) {
    range[i] = start
  }

  return range
}

export function linspace(start: number, stop: number, num: number = 100): Array<number> {
  const step = (stop - start) / (num - 1)
  let array = new Array(num)

  for (let i = 0; i < num; i++) {
    array[i] = start + step*i
  }

  return array
}

export function transpose<T>(array: Array<Array<T>>): Array<Array<T>> {
  const rows = array.length
  const cols = array[0].length

  let transposed: Array<Array<T>> = []

  for (let j = 0; j < cols; j++) {
    transposed[j] = []

    for (let i = 0; i < rows; i++) {
      transposed[j][i] = array[i][j]
    }
  }

  return transposed
}

export function sum(array: Array<number>): number {
  return array.reduce((a, b) => a + b, 0)
}

export function cumsum(array: Array<number>): Array<number> {
  const result: Array<number> = []
  array.reduce((a, b, i) => result[i] = a + b, 0)
  return result
}

export function min(array: Array<number>): number {
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

export function minBy<T>(array: Array<T>, key: (item: T) => number): T {
  let value: T
  let result: T
  let computed: number
  let resultComputed = Infinity

  for (let i = 0, length = array.length; i < length; i++) {
    value = array[i]
    computed = key(value)
    if (computed < resultComputed) {
      result = value
      resultComputed = computed
    }
  }

  return result
}

export function max(array: Array<number>): number {
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

export function maxBy<T>(array: Array<T>, key: (item: T) => number): T {
  let value: T
  let result: T
  let computed: number
  let resultComputed = -Infinity

  for (let i = 0, length = array.length; i < length; i++) {
    value = array[i]
    computed = key(value)
    if (computed > resultComputed) {
      result = value
      resultComputed = computed
    }
  }

  return result
}

export function argmin(array: Array<number>): number {
  return minBy(range(array.length), (i) => array[i])
}

export function argmax(array: Array<number>): number {
  return maxBy(range(array.length), (i) => array[i])
}

export function all<T>(array: Array<T>, predicate: (item: T) => boolean): boolean {
  for (const item of array) {
    if (!predicate(item))
      return false
  }
  return true
}

export function any<T>(array: Array<T>, predicate: (item: T) => boolean): boolean {
  for (const item of array) {
    if (predicate(item))
      return true
  }
  return false
}

function findIndexFactory(dir: number) {
  return function<T>(array: Array<T>, predicate: (item: T) => boolean): number {
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

export function sortedIndex<T>(array: Array<T>, value: T): number {
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

export function sortBy<T>(array: Array<T>, key: (item: T) => number): Array<T> {
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

export function uniq<T>(array: Array<T>): Array<T> {
  const result: Array<T> = []
  for (const value of array) {
    if (!contains(result, value)) {
      result.push(value)
    }
  }
  return result
}

export function uniqBy<T, U>(array: Array<T>, key: (item: T) => U): Array<T> {
  const result: Array<T> = []
  const seen: Array<U> = []
  for (const value of array) {
    const computed = key(value)
    if (!contains(seen, computed)) {
      seen.push(computed)
      result.push(value)
    }
  }
  return result
}

export function union<T>(...arrays: Array<Array<T>>): Array<T> {
  return uniq(concat(arrays))
}

export function intersection<T>(array: Array<T>, ...arrays: Array<Array<T>>): Array<T> {
  const result: Array<T> = []
  top: for (const item of array) {
    if (contains(result, item))
      continue
    for (const other of arrays) {
      if (!contains(other, item))
        continue top;
    }
    result.push(item)
  }
  return result
}

export function difference<T>(array: Array<T>, ...arrays: Array<Array<T>>): Array<T> {
  const rest = concat(arrays)
  return array.filter((value) => !contains(rest, value))
}
