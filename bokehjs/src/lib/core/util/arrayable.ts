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

export function minBy<T>(array: Arrayable<T>, key: (item: T) => number): T {
  if (array.length == 0)
    throw new Error("minBy() called with an empty array")

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

export function maxBy<T>(array: Arrayable<T>, key: (item: T) => number): T {
  if (array.length == 0)
    throw new Error("maxBy() called with an empty array")

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
