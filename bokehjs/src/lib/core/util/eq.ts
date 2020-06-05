//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

import {isFunction} from "./types"

export const equals = Symbol("equals")

export interface Equals {
  [equals](that: this, cmp: Comparator): boolean
}

export const wildcard: any = Symbol("wildcard")

const toString = Object.prototype.toString

export class Comparator {
  private readonly a_stack: unknown[] = []
  private readonly b_stack: unknown[] = []

eq(a: any, b: any): boolean {
  // Identical objects are equal. `0 === -0`, but they aren't identical.
  // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
  if (a === b)
    return a !== 0 || 1 / a === 1 / b
  if (a === wildcard || b === wildcard)
    return true
  // A strict comparison is necessary because `null == undefined`.
  if (a == null || b == null)
    return a === b
  // Compare `[[Class]]` names.
  const className = toString.call(a)
  if (className !== toString.call(b)) return false
  switch (className) {
    // Strings, numbers, regular expressions, dates, and booleans are compared by value.
    case '[object RegExp]':
    // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
    case '[object String]':
      // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
      // equivalent to `new String("5")`.
      return '' + a === '' + b
    case '[object Number]':
      return this.numbers(a, b)
    case '[object Date]':
    case '[object Boolean]':
      // Coerce dates and booleans to numeric primitive values. Dates are compared by their
      // millisecond representations. Note that invalid dates with millisecond representations
      // of `NaN` are not equivalent.
      return +a === +b
  }

  const areArrays = className === '[object Array]'
  if (!areArrays) {
    if (typeof a != 'object' || typeof b != 'object') return false

    // Objects with different constructors are not equivalent, but `Object`s or `Array`s
    // from different frames are.
    const aCtor = a.constructor, bCtor = b.constructor
    if (aCtor !== bCtor && !(isFunction(aCtor) && aCtor instanceof aCtor &&
                             isFunction(bCtor) && bCtor instanceof bCtor)
                        && ('constructor' in a && 'constructor' in b)) {
      return false
    }
  }
  // Assume equality for cyclic structures. The algorithm for detecting cyclic
  // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

  // Initializing stack of traversed objects.
  // It's done here since we only need them for objects and arrays comparison.
  const {a_stack, b_stack} = this
  let length = a_stack.length
  while (length--) {
    // Linear search. Performance is inversely proportional to the number of
    // unique nested structures.
    if (a_stack[length] === a) return b_stack[length] === b
  }

  // Add the first object to the stack of traversed objects.
  a_stack.push(a)
  b_stack.push(b)

  if (equals in a && equals in b) {
    return a[equals](b, this)
  }

  // Recursively compare objects and arrays.
  if (areArrays) {
    return this.arrays(a, b)
  } else {
    // Deep compare objects.
    const keys = Object.keys(a)
    let key
    length = keys.length
    // Ensure that both objects contain the same number of properties before comparing deep equality.
    if (Object.keys(b).length !== length)
      return false
    while (length--) {
      // Deep compare each member
      key = keys[length]
      if (!(b.hasOwnProperty(key) && this.eq(a[key], b[key])))
        return false
    }
  }
  // Remove the first object from the stack of traversed objects.
  a_stack.pop()
  b_stack.pop()
  return true
}

  numbers(a: number, b: number): boolean {
    return Object.is(a, b)
  }

  arrays(a: ArrayLike<unknown>, b: ArrayLike<unknown>): boolean {
    let {length} = a
    if (length != b.length)
      return false
    while (length--) {
      if (!this.eq(a[length], b[length]))
        return false
    }
    return true
  }
}

const {abs} = Math

export class SimilarComparator extends Comparator {
  constructor(readonly tolerance: number = 1e-4) {
    super()
  }

  numbers(a: number, b: number): boolean {
    return super.numbers(a, b) || abs(a - b) < this.tolerance
  }
}

export function is_equal(a: unknown, b: unknown): boolean {
  const comparator = new Comparator()
  return comparator.eq(a, b)
}

export function is_similar(a: unknown, b: unknown, tolerance?: number): boolean {
  const comparator = new SimilarComparator(tolerance)
  return comparator.eq(a, b)
}

/** @deprecated */
export const isEqual = is_equal
