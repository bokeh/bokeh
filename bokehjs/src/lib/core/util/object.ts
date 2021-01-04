import {PlainObject} from "../types"
import {concat, union} from "./array"

const {hasOwnProperty} = Object.prototype

export const {keys, values, entries, assign: extend} = Object

export function clone<T>(obj: PlainObject<T>): PlainObject<T> {
  return {...obj}
}

export function merge<T>(obj1: PlainObject<T[]>, obj2: PlainObject<T[]>): PlainObject<T[]> {
  /*
   * Returns an object with the array values for obj1 and obj2 unioned by key.
   */
  const result: PlainObject<T[]> = Object.create(Object.prototype)

  const keys = concat([Object.keys(obj1), Object.keys(obj2)])

  for (const key of keys){
    const arr1 = hasOwnProperty.call(obj1, key) ? obj1[key] : []
    const arr2 = hasOwnProperty.call(obj2, key) ? obj2[key] : []
    result[key] = union(arr1, arr2)
  }

  return result
}

export function size(obj: PlainObject): number {
  return Object.keys(obj).length
}

export function isEmpty(obj: PlainObject): boolean {
  return size(obj) == 0
}

export function to_object<T>(map: Iterable<[string | number, T]>): PlainObject<T> {
  const obj: PlainObject<T> = {}
  for (const [key, val] of map) {
    obj[key] = val
  }
  return obj
}
