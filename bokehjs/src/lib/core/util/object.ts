import type {Arrayable, DictLike, PlainObject} from "../types"
import {isPlainObject} from "./types"
import {union} from "./array"

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

export function clone<T>(obj: DictLike<T>): DictLike<T> {
  return obj instanceof Map ? new Map(obj) : {...obj}
}

export function merge<K, V>(obj0: Map<K, Arrayable<V>>, obj1: Map<K, Arrayable<V>>): Map<K, V[]> {
  /*
  * Returns an object with the array values for obj1 and obj2 unioned by key.
  */
  const result: Map<K, V[]> = new Map()
  const keys = [...obj0.keys(), ...obj1.keys()]

  for (const key of keys) {
    const v0 = obj0.get(key)
    const v1 = obj1.get(key)
    const arr0 = v0 === undefined ? [] : v0
    const arr1 = v1 === undefined ? [] : v1
    result.set(key, union(arr0, arr1))
  }

  return result
}

export function size(obj: DictLike<unknown>): number {
  return obj instanceof Map ? obj.size : Object.keys(obj).length
}

export function is_empty(obj: DictLike<unknown>): boolean {
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
