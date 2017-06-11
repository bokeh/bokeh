import {concat, union} from "./array"

export const keys = Object.keys

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
      if (source.hasOwnProperty(key)) {
        dest[key] = source[key]
      }
    }
  }

  return dest
}

export function clone<T>(obj: T): T {
  return extend({}, obj)
}

export function merge<T>(obj1: {[key: string] : Array<T>}, obj2: {[key: string]: Array<T>}): {[key: string]: Array<T>} {
  /*
   * Returns an object with the array values for obj1 and obj2 unioned by key.
   */
  const result: {[key: string]: Array<T>} = Object.create(Object.prototype);

  const keys = concat([Object.keys(obj1), Object.keys(obj2)])

  for (const key of keys){
    const arr1 = obj1.hasOwnProperty(key) ? obj1[key] : []
    const arr2 = obj2.hasOwnProperty(key) ? obj2[key] : []
    result[key] = union(arr1, arr2)
  }

  return result
}

export function size<T>(obj: T): number {
  return Object.keys(obj).length
}

export function isEmpty<T>(obj: T): boolean {
  return size(obj) === 0
}
