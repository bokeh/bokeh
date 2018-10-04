//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

import {Anything, Arrayable, TypedArray} from "../types"
import {all} from "./array"

const toString = Object.prototype.toString

export function isBoolean(obj: Anything): obj is boolean {
  return obj === true || obj === false || toString.call(obj) === '[object Boolean]'
}

export function isNumber(obj: Anything): obj is number {
  return toString.call(obj) === "[object Number]"
}

export function isInteger(obj: Anything): obj is number {
  return isNumber(obj) && isFinite(obj) && Math.floor(obj) === obj
}

export function isString(obj: Anything): obj is string {
  return toString.call(obj) === "[object String]"
}

export function isStrictNaN(obj: Anything): obj is number {
  return isNumber(obj) && obj !== +obj
}

export function isFunction(obj: Anything): obj is Function {
  return toString.call(obj) === "[object Function]"
}

export function isArray<T>(obj: Anything): obj is T[] {
  return Array.isArray(obj)
}

export function isArrayOf<T>(arr: Anything[], predicate: (item: Anything) => item is T): arr is T[] {
  return all(arr, predicate)
}

export function isArrayableOf<T>(arr: Arrayable, predicate: (item: Anything) => item is T): arr is Arrayable<T> {
  for (let i = 0, end = arr.length; i < end; i++) {
    if (!predicate(arr[i]))
      return false
  }
  return true
}

export function isTypedArray(obj: Anything): obj is TypedArray {
  return obj != null && obj.buffer != null && obj.buffer instanceof ArrayBuffer
}

export function isObject(obj: Anything): obj is object {
  const tp = typeof obj
  return tp === 'function' || tp === 'object' && !!obj
}

export function isPlainObject(obj: Anything): obj is {[key: string]: unknown} {
  return isObject(obj) && (obj.constructor == null || obj.constructor === Object)
}
