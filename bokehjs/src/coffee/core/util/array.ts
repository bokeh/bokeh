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
  const result = []
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

export function values<T>(object: {[key: string]: T}): Array<T> {
  const keys = Object.keys(object)
  const length = keys.length
  const values = new Array<T>(length)
  for (let i = 0; i < length; i++) {
    values[i] = object[keys[i]]
  }
  return values
}

export function extend<T, T1>(dest: T, source: T1): T & T1;
export function extend<R>(dest: any, ...sources: Array<any>): R {
  for (const source of sources) {
    for (const key in source) {
      if (dest[key] === undefined && source.hasOwnProperty(key)) {
        dest[key] = source[key]
      }
    }
  }

  return dest
}

export function clone<T>(array: Array<T>): Array<T> {
  return array.slice()
}

export function cloneObj<T>(obj: T): T {
  return extend({}, obj)
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
