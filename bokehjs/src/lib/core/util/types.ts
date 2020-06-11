//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

import {Arrayable, TypedArray} from "../types"
import {every} from "./array"

const toString = Object.prototype.toString

export function isBoolean(obj: unknown): obj is boolean {
  return obj === true || obj === false || toString.call(obj) === '[object Boolean]'
}

export function isNumber(obj: unknown): obj is number {
  return toString.call(obj) === "[object Number]"
}

export function isInteger(obj: unknown): obj is number {
  return isNumber(obj) && Number.isInteger(obj)
}

export function isString(obj: unknown): obj is string {
  return toString.call(obj) === "[object String]"
}

export function isFunction(obj: unknown): obj is Function {
  return toString.call(obj) === "[object Function]"
}

export function isArray<T>(obj: unknown): obj is T[] {
  return Array.isArray(obj)
}

export function isArrayOf<T>(arr: unknown[], predicate: (item: unknown) => item is T): arr is T[] {
  return every(arr, predicate)
}

export function isArrayableOf<T>(arr: Arrayable, predicate: (item: unknown) => item is T): arr is Arrayable<T> {
  for (let i = 0, end = arr.length; i < end; i++) {
    if (!predicate(arr[i]))
      return false
  }
  return true
}

export function isTypedArray(obj: unknown): obj is TypedArray {
  return ArrayBuffer.isView(obj) && !(obj instanceof DataView)
}

export function isObject(obj: unknown): obj is object {
  const tp = typeof obj
  return tp === 'function' || tp === 'object' && !!obj
}

export function isPlainObject(obj: unknown): obj is {[key: string]: unknown} {
  return isObject(obj) && (obj.constructor == null || obj.constructor === Object)
}

export function isIterable(obj: unknown): obj is Iterable<unknown> {
  return Symbol.iterator in Object(obj)
}
