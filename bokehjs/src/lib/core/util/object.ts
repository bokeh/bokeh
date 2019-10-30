import {concat, union} from "./array"

export const {keys, values, assign: extend} = Object

export function clone<T extends object>(obj: T): T {
  return {...obj}
}

export function merge<T>(obj1: {[key: string]: T[]}, obj2: {[key: string]: T[]}): {[key: string]: T[]} {
  /*
   * Returns an object with the array values for obj1 and obj2 unioned by key.
   */
  const result: {[key: string]: T[]} = Object.create(Object.prototype)

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
