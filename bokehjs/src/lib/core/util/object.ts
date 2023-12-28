import type {Arrayable, DictLike, PlainObject} from "../types"
import {isPlainObject} from "./types"
import {concat, union} from "./array"

const {hasOwnProperty} = Object.prototype

export const {assign} = Object
export const extend = assign

export function to_object<T = any>(obj: PlainObject<T> | Iterable<readonly [PropertyKey, T]>): PlainObject<T> {
  return isPlainObject(obj) ? obj : Object.fromEntries(obj)
}

export function keys<T = unknown>(obj: {[key: string]: T} | Map<string, T>): string[]
export function keys(obj: {}): string[]

export function keys<T = unknown>(obj: {[key: string]: T} | Map<string, T>): string[] {
  return obj instanceof Map ? [...obj.keys()] : Object.keys(obj)
}

export function values<T = unknown>(obj: {[key: string]: T} | Map<string, T>): T[]
export function values(obj: {}): unknown[]

export function values<T = unknown>(obj: {[key: string]: T} | Map<string, T>): T[] {
  return obj instanceof Map ? [...obj.values()] : Object.values(obj)
}

export function entries<T = unknown>(obj: {[key: string]: T} | Map<string, T>): [string, T][]
export function entries(obj: {}): [string, unknown][]

export function entries<T = unknown>(obj: {[key: string]: T} | Map<string, T>): [string, T][] {
  return obj instanceof Map ? [...obj.entries()] : Object.entries(obj)
}

export const typed_keys: <T extends object>(obj: T) => (keyof T)[] = Object.keys

export const typed_values: <T extends object>(obj: T) => T[keyof T][] = Object.values

export const typed_entries: <T extends object>(obj: T) => [keyof T, T[keyof T]][] = Object.entries

export function clone<T>(obj: PlainObject<T>): PlainObject<T> {
  return {...obj}
}

export function merge<T>(obj1: PlainObject<Arrayable<T>>, obj2: PlainObject<Arrayable<T>>): PlainObject<T[]> {
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

export class MapProxy<V> implements Map<string, V> {
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

export function dict<V>(obj: DictLike<V>): Map<string, V> {
  return isPlainObject(obj) ? new MapProxy(obj) : obj
}
