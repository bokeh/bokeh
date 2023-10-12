import type {PlainObject, Arrayable} from "../types"
import {union} from "./array"

export const {keys, values, entries, assign, fromEntries: to_object} = Object
export const extend = assign

export const typed_keys: <T extends object>(obj: T) => (keyof T)[] = keys

export const typed_values: <T extends object>(obj: T) => T[keyof T][] = values

export const typed_entries: <T extends object>(obj: T) => [keyof T, T[keyof T]][] = entries

export function clone<T>(obj: PlainObject<T>): PlainObject<T> {
  return {...obj}
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

export function dict<V>(o: {[key: string]: V}): Dict<V> {
  return new Dict(o)
}
