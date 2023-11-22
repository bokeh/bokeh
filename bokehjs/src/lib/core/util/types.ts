//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

import type {Arrayable, TypedArray} from "../types"

const toString = Object.prototype.toString

export function is_undefined(obj: unknown): obj is undefined {
  return typeof obj === "undefined"
}

export function is_defined<T>(obj: T): obj is (T extends undefined ? never : T) {
  return typeof obj !== "undefined"
}

// XXX: use only to work around strict conditional expressions
export function is_nullish(obj: unknown): obj is null | undefined {
  return obj == null
}

export function isNull(obj: unknown): obj is null | undefined {
  return obj == null
}

export function isNotNull<T>(obj: T | null | undefined): obj is T {
  return obj != null
}

export const non_null = isNotNull

export function isBoolean(obj: unknown): obj is boolean {
  return obj === true || obj === false || toString.call(obj) === "[object Boolean]"
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

export function isSymbol(obj: unknown): obj is symbol {
  return typeof obj === "symbol"
}

export type Primitive = null | boolean | number | string | symbol

export function isPrimitive(obj: unknown): obj is Primitive {
  return obj === null || isBoolean(obj) || isNumber(obj) || isString(obj) || isSymbol(obj)
}

export function isFunction(obj: unknown): obj is Function {
  const rep = toString.call(obj)
  switch (rep) {
    case "[object Function]":
    case "[object AsyncFunction]":
    case "[object GeneratorFunction]":
    case "[object AsyncGeneratorFunction]":
      return true
    default:
      return false
  }
}

export function isArray<T>(obj: unknown): obj is T[] {
  return Array.isArray(obj)
}

export function isArrayOf<T>(array: unknown[], predicate: (item: unknown) => item is T): array is T[] {
  for (const item of array) {
    if (!predicate(item))
      return false
  }
  return true
}

export function isArrayableOf<T>(array: Arrayable, predicate: (item: unknown) => item is T): array is Arrayable<T> {
  for (const item of array) {
    if (!predicate(item))
      return false
  }
  return true
}

export function isTypedArray(obj: unknown): obj is TypedArray {
  return ArrayBuffer.isView(obj) && !(obj instanceof DataView)
}

export function isObject(obj: unknown): obj is object {
  const tp = typeof obj
  return tp === "function" || tp === "object" && !!obj
}

export function isBasicObject<T>(obj: unknown): obj is {[key: string]: T} {
  return isObject(obj) && is_nullish(obj.constructor)
}

export function isPlainObject<T>(obj: unknown): obj is {[key: string]: T} {
  return isObject(obj) && (is_nullish(obj.constructor) || obj.constructor === Object)
}

export function isIterable(obj: unknown): obj is Iterable<unknown> {
  return isObject(obj) && Symbol.iterator in obj
}

export function isArrayable(obj: unknown): obj is Arrayable<unknown> {
  return isIterable(obj) && "length" in obj
}
