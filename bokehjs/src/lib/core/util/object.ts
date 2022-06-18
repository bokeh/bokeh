import {PlainObject} from "../types"
import {concat, union} from "./array"

const {hasOwnProperty} = Object.prototype

export const {keys, values, entries, assign, fromEntries: to_object} = Object
export const extend = assign

export function clone<T>(obj: PlainObject<T>): PlainObject<T> {
  return {...obj}
}

export function merge<T>(obj1: PlainObject<T[]>, obj2: PlainObject<T[]>): PlainObject<T[]> {
  /*
   * Returns an object with the array values for obj1 and obj2 unioned by key.
   */
  const result: PlainObject<T[]> = Object.create(Object.prototype)

  const keys = concat([Object.keys(obj1), Object.keys(obj2)])

  for (const key of keys) {
    const arr1 = hasOwnProperty.call(obj1, key) ? obj1[key] : []
    const arr2 = hasOwnProperty.call(obj2, key) ? obj2[key] : []
    result[key] = union(arr1, arr2)
  }

  return result
}

export function size(obj: PlainObject): number {
  return Object.keys(obj).length
}

export function is_empty(obj: PlainObject): boolean {
  return size(obj) == 0
}

export class Dict<V> implements Map<string, V> {
  constructor(readonly obj: {[key: string]: V}) {}

  readonly [Symbol.toStringTag] = "Dict"

  clear(): void {
    for (const key of keys(this.obj)) {
      delete this.obj[key]
    }
  }

  delete(key: string): boolean {
    const had = key in this
    delete this.obj[key]
    return had
  }

  get(key: string): V | undefined {
    return key in this.obj ? this.obj[key] : undefined
  }

  has(key: string): boolean {
    return key in this.obj
  }

  set(key: string, value: V): this {
    this.obj[key] = value
    return this
  }

  get size(): number {
    return size(this.obj)
  }

  get is_empty(): boolean {
    return this.size == 0
  }

  [Symbol.iterator](): IterableIterator<[string, V]> {
    return this.entries()
  }

  *keys(): IterableIterator<string> {
    yield* keys(this.obj)
  }

  *values(): IterableIterator<V> {
    yield* values(this.obj)
  }

  *entries(): IterableIterator<[string, V]> {
    yield* entries(this.obj)
  }

  forEach(callback: (value: V, key: string, map: Map<string, V>) => void, that?: unknown): void {
    for (const [key, value] of this.entries()) {
      callback.call(that, value, key, this)
    }
  }
}

export function obj<V>(o: {[key: string]: V}): Dict<V> {
  return new Dict(o)
}
