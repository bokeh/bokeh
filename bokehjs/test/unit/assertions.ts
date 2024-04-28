import {isNumber, isString, isArray, isTypedArray, isPlainObject, isFunction, isIterable} from "@bokehjs/core/util/types"
import {is_equal, is_structurally_equal, is_similar} from "@bokehjs/core/util/eq"
import {to_string} from "@bokehjs/core/util/pretty"
import type {Class} from "@bokehjs/core/class"

type Constructor<T> = Function & {prototype: T}

type ToFn<T> = {
  to: Throw & NotThrow & Be<T>
}

type ToVal<T> = {
  to: Be<T>
}

type ToElement = {
  to: Have
}

type Have = {
  have: ElementAssertions
}

type Throw = {
  throw(error_type?: Class<Error>, pattern?: RegExp | string): void
}

type NotThrow = {
  not: Throw
}

type Be<T> = {
  be: Assertions<T>
  not: NotBe<T>
}

type NotBe<T> = {
  be: Assertions<T>
}

type Assertions<T> = {
  structurally: {equal(expected: T): void}
  equal(expected: T): void
  similar(expected: T, tolerance?: number): void
  identical(expected: T): void
  instanceof(type: any): void
  undefined: void
  null: void
  true: void
  false: void
  NaN: void
  empty: void
  below(expected: number): void
  above(expected: number): void
  within(low: number, high: number): void
}

type ElementAssertions = {
  equal_attributes(expected: Element): void
}

function compare_attributes(actual: Element, expected: Element) {
  if (actual.nodeName !== expected.nodeName) {
    throw new ExpectationError(`expected <${actual.nodeName}> to be equal <${expected.nodeName}>`)
  }

  const names = (el: Element) => [...el.attributes].map((attr) => attr.name)
  const attrs = new Set([...names(actual), ...names(expected)])

  for (const attr of attrs) {
    const actual_val = actual.getAttribute(attr)
    const expected_val = expected.getAttribute(attr)

    if (actual_val == null || expected_val == null) {
      if (actual_val == null) {
        throw new ExpectationError(`expected attribute ${attr} missing in the actual element`)
      } else {
        throw new ExpectationError(`actual attribute ${attr} missing in the expected element`)
      }
    } else {
      const tag = actual.nodeName
      if (tag == "image" && attr == "href" && expected_val.startsWith("^") && expected_val.endsWith("$")) {
        if (actual_val.match(expected_val) == null) {
          throw new ExpectationError(`expected <${tag} ${attr}="${expected_val}"> to match <${tag} ${attr}="${actual_val}>"`)
        }
      } else {
        if (actual_val !== expected_val) {
          throw new ExpectationError(`expected <${tag} ${attr}="${expected_val}"> to be equal <${tag} ${attr}="${actual_val}>"`)
        }
      }
    }
  }
}

function compare_element_attributes(actual: Element, expected: Element) {
  compare_attributes(actual, expected)

  if (actual.childElementCount != expected.childElementCount) {
    throw new ExpectationError("elements differ on child count")
  }

  for (let i = 0; i < expected.childElementCount; i++) {
    compare_element_attributes(actual.children[i], expected.children[i])
  }
}

class ElementAsserts implements ElementAssertions {
  constructor(readonly value: Element) {}

  equal_attributes(expected: Element): void {
    try {
      compare_element_attributes(this.value, expected)
    } catch (err) {
      throw new ExpectationError(`expected ${this.value.outerHTML} to be equal to ${expected.outerHTML} ${to_string(err)}`)
    }
  }
}

class Asserts implements Assertions<unknown> {
  constructor(readonly value: unknown, readonly negated: boolean = false) {}

  get structurally() {
    const that = this
    return {
      equal(expected: unknown): void {
        const {value} = that
        if (!is_structurally_equal(that.value, expected) == !that.negated) {
          const be = that.negated ? "not be" : "be"
          throw new ExpectationError(`expected ${to_string(value)} to ${be} structurally equal to ${to_string(expected)}`)
        }
      },
    }
  }

  equal(expected: unknown): void {
    const {value} = this
    if (!is_equal(this.value, expected) == !this.negated) {
      const be = this.negated ? "not be" : "be"
      throw new ExpectationError(`expected ${to_string(value)} to ${be} equal to ${to_string(expected)}`)
    }
  }

  similar(expected: unknown, tolerance: number = 1e-4): void {
    const {value} = this
    if (!is_similar(this.value, expected, tolerance) == !this.negated) {
      const be = this.negated ? "not be" : "be"
      throw new ExpectationError(`expected ${to_string(value)} to ${be} similar to ${to_string(expected)} with ${to_string(tolerance)} tolerance`)
    }
  }

  identical(expected: unknown): void {
    const {value} = this
    if (!Object.is(this.value, expected) == !this.negated) {
      const be = this.negated ? "not be" : "be"
      throw new ExpectationError(`expected ${to_string(value)} to ${be} identical to ${to_string(expected)}`)
    }
  }

  equal_attributes(expected: unknown): void {
    const {value} = this
    if (!is_equal(this.value, expected) == !this.negated) {
      const be = this.negated ? "not be" : "be"
      throw new ExpectationError(`expected ${to_string(value)} to ${be} equal to ${to_string(expected)}`)
    }
  }

  instanceof(expected: Constructor<unknown>): void {
    const {value} = this
    if (!(value instanceof expected) == !this.negated) {
      const be = this.negated ? "not be" : "be"
      throw new ExpectationError(`expected ${to_string(value)} to ${be} an instance of ${to_string(expected)}`)
    }
  }

  private _is(expected: unknown): void {
    const {value} = this
    if (!Object.is(this.value, expected) == !this.negated) {
      const be = this.negated ? "not be" : "be"
      throw new ExpectationError(`expected ${to_string(value)} to ${be} ${to_string(expected)}`)
    }
  }

  get undefined(): void {
    return this._is(undefined)
  }
  get null(): void {
    return this._is(null)
  }
  get false(): void {
    return this._is(false)
  }
  get true(): void {
    return this._is(true)
  }
  get NaN(): void {
    return this._is(NaN)
  }

  get empty(): void {
    const {value} = this

    const is_empty = (() => {
      if (isArray(value) || isTypedArray(value)) {
        return value.length == 0
      } else if (isPlainObject(value)) {
        return Object.keys(value).length == 0
      } else if (isIterable(value)) {
        return value[Symbol.iterator]().next().done
      } else {
        return null
      }
    })()

    if (is_empty == null) {
      throw new ExpectationError(`expected ${to_string(value)} to be an array-like, a plain object or an iterable container`)
    }

    if (!is_empty == !this.negated) {
      const be = this.negated ? "not be" : "be"
      throw new ExpectationError(`expected ${to_string(value)} to ${be} empty`)
    }

    return undefined
  }

  below(expected: number): void {
    const {value} = this
    if (!(isNumber(value) && value < expected) == !this.negated) {
      const be = this.negated ? "not be" : "be"
      throw new ExpectationError(`expected ${to_string(value)} to ${be} below ${to_string(expected)}`)
    }
  }

  above(expected: number): void {
    const {value} = this
    if (!(isNumber(value) && value > expected) == !this.negated) {
      const be = this.negated ? "not be" : "be"
      throw new ExpectationError(`expected ${to_string(value)} to ${be} below ${to_string(expected)}`)
    }
  }

  within(low: number, high: number): void {
    const {value} = this
    if (!(isNumber(value) && low <= value && value <= high) == !this.negated) {
      const be = this.negated ? "not be" : "be"
      throw new ExpectationError(`expected ${to_string(value)} to ${be} within ${to_string(low)} .. ${to_string(high)} range`)
    }
  }
}

export class ExpectationError extends Error {
  constructor(message: string) {
    super(message)
  }
}

function Throws(fn: () => unknown) {
  return function(error_type?: Class<Error>, pattern?: RegExp | string) {
    function handle_error(error: unknown) {
      if (!(error instanceof Error)) {
        throw new ExpectationError(`expected ${to_string(fn)} to throw a proper exception, got ${to_string(error)}`)
      }

      if (error_type != null && !(error instanceof error_type)) {
        throw new ExpectationError(`expected ${to_string(fn)} to throw an exception of type ${error_type}, got ${to_string(error)}`)
      }

      if (pattern instanceof RegExp) {
        if (error.message.match(pattern) == null) {
          throw new ExpectationError(`expected ${to_string(fn)} to throw an exception matching ${to_string(pattern)}, got ${to_string(error)}`)
        }
      } else if (isString(pattern)) {
        if (!error.message.includes(pattern)) {
          throw new ExpectationError(`expected ${to_string(fn)} to throw an exception including ${to_string(pattern)}, got ${to_string(error)}`)
        }
      }
    }

    function fail(): never {
      throw new ExpectationError(`expected ${to_string(fn)} to throw an exception, but it did not`)
    }

    try {
      const result = fn()
      if (result instanceof Promise) {
        return result.then(() => fail(), (error) => handle_error(error))
      }
    } catch (error) {
      handle_error(error)
      return
    }

    fail()
  }
}

function NotThrows(fn: () => unknown) {
  return function(error_type?: Class<Error>, pattern?: RegExp | string) {
    try {
      fn()
    } catch (error) {
      if (error_type == null && pattern == null) {
        throw new ExpectationError(`expected ${to_string(fn)} to not throw, got ${to_string(error)}`)
      } else {
        if (error_type != null && error instanceof error_type) {
          throw new ExpectationError(`expected ${to_string(fn)} to not throw an exception of type ${error_type}, got ${to_string(error)}`)
        }

        if (pattern != null && error instanceof Error) {
          if (pattern instanceof RegExp) {
            if (error.message.match(pattern) != null) {
              throw new ExpectationError(`expected ${to_string(fn)} to not throw an exception matching ${to_string(pattern)}, got ${to_string(error)}`)
            }
          } else if (isString(pattern)) {
            if (error.message.includes(pattern)) {
              throw new ExpectationError(`expected ${to_string(fn)} to not throw an exception including ${to_string(pattern)}, got ${to_string(error)}`)
            }
          }
        }
      }
    }
  }
}

export function expect<T>(fn: () => T): ToFn<T>
export function expect<T>(val: T): ToVal<T>

export function expect<T>(fn_or_val: (() => T) | T): ToFn<T> | ToVal<T> {
  if (isFunction(fn_or_val)) {
    const fn = fn_or_val
    return {
      to: {
        throw: Throws(fn),
        be: new Asserts(fn),
        not: {
          throw: NotThrows(fn),
          be: new Asserts(fn, true),
        },
      },
    }
  } else {
    const val = fn_or_val
    return {
      to: {
        be: new Asserts(val),
        not: {be: new Asserts(val, true)},
      },
    }
  }
}

export function expect_not_null<T>(val: T | null | undefined): asserts val is T {
  expect(val).to.not.be.null
}

export function expect_instanceof<T>(val: unknown, constructor: Constructor<T>): asserts val is T {
  expect(val).to.be.instanceof(constructor)
}

export function expect_condition(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new ExpectationError(`unmet expectation: ${message}`)
  }
}

export function expect_element(element: Element): ToElement {
  return {
    to: {
      have: new ElementAsserts(element),
    },
  }
}
