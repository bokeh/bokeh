import {expect} from "assertions"

import {
  isBoolean,
  isNumber,
  isInteger,
  isString,
  isFunction,
  isArray,
  isArrayOf,
  isArrayableOf,
  isTypedArray,
  isObject,
  isPlainObject,
} from "@bokehjs/core/util/types"

class X {}

describe("core/util/types module", () => {

  it("should support isBoolean() function", () => {
    expect(isBoolean(0)).to.be.false
    expect(isBoolean(1)).to.be.false
    expect(isBoolean(false)).to.be.true
    expect(isBoolean(true)).to.be.true
    /* eslint-disable no-new-wrappers */
    expect(isBoolean(new Boolean(false))).to.be.true
    expect(isBoolean(new Boolean(true))).to.be.true
    /* eslint-enable no-new-wrappers */
    expect(isBoolean(new X())).to.be.false
  })

  it("should support isNumber() function", () => {
    expect(isNumber(0)).to.be.true
    expect(isNumber(1)).to.be.true
    expect(isNumber(-1)).to.be.true
    expect(isNumber(1.9)).to.be.true
    expect(isNumber(-1.9)).to.be.true
    expect(isNumber(Infinity)).to.be.true
    expect(isNumber(-Infinity)).to.be.true
    expect(isNumber(NaN)).to.be.true
    expect(isNumber(false)).to.be.false
    expect(isNumber(true)).to.be.false
    expect(isNumber("0")).to.be.false
    expect(isNumber("Infinity")).to.be.false
    expect(isNumber(new X())).to.be.false
  })

  it("should support isInteger() function", () => {
    expect(isInteger(0)).to.be.true
    expect(isInteger(1)).to.be.true
    expect(isInteger(-1)).to.be.true
    expect(isInteger(1.9)).to.be.false
    expect(isInteger(-1.9)).to.be.false
    expect(isInteger(Infinity)).to.be.false
    expect(isInteger(-Infinity)).to.be.false
    expect(isInteger(NaN)).to.be.false
    expect(isInteger(false)).to.be.false
    expect(isInteger(true)).to.be.false
    expect(isNumber("0")).to.be.false
    expect(isNumber("Infinity")).to.be.false
    expect(isInteger(new X())).to.be.false
  })

  it("should support isString() function", () => {
    expect(isString(0)).to.be.false
    expect(isString("a")).to.be.true
    expect(isString(String("a"))).to.be.true
    /* eslint-disable no-new-wrappers */
    expect(isString(new String("a"))).to.be.true
    /* eslint-enable no-new-wrappers */
    expect(isString(new X())).to.be.false
  })

  it("should support isFunction() function", () => {
    expect(isFunction(() => 0)).to.be.true
    expect(isFunction(new Function("return 1"))).to.be.true
    expect(isFunction(new X())).to.be.false
  })

  it("should support isArray() function", () => {
    expect(isArray([])).to.be.true
    expect(isArray([1, 2, 3])).to.be.true
    expect(isArray(["a", "b", "c"])).to.be.true
    expect(isArray(new Uint8Array())).to.be.false
    expect(isArray(new Uint16Array())).to.be.false
    expect(isArray(new Uint32Array())).to.be.false
    expect(isArray(new Int8Array())).to.be.false
    expect(isArray(new Int16Array())).to.be.false
    expect(isArray(new Int32Array())).to.be.false
    expect(isArray(new Float32Array())).to.be.false
    expect(isArray(new Float64Array())).to.be.false
    expect(isArray(new Map())).to.be.false
    expect(isArray(new Set())).to.be.false
    expect(isArray(new X())).to.be.false
    expect(isArray({})).to.be.false
  })

  it("should support isArrayOf() function", () => {
    expect(isArrayOf([0, 1, 2], isNumber)).to.be.true
    expect(isArrayOf([0, 1, "2"], isNumber)).to.be.false
  })

  it("should support isArrayableOf() function", () => {
    expect(isArrayableOf([0, 1, 2], isNumber)).to.be.true
    expect(isArrayableOf([0, 1, "2"], isNumber)).to.be.false
  })

  it("should support isTypedArray() function", () => {
    expect(isTypedArray([])).to.be.false
    expect(isTypedArray(new Uint8Array())).to.be.true
    expect(isTypedArray(new Uint16Array())).to.be.true
    expect(isTypedArray(new Uint32Array())).to.be.true
    expect(isTypedArray(new Int8Array())).to.be.true
    expect(isTypedArray(new Int16Array())).to.be.true
    expect(isTypedArray(new Int32Array())).to.be.true
    expect(isTypedArray(new Float32Array())).to.be.true
    expect(isTypedArray(new Float64Array())).to.be.true
    const buffer = new ArrayBuffer(10)
    expect(isTypedArray(new DataView(buffer))).to.be.false
    expect(isTypedArray(buffer)).to.be.false
    expect(isTypedArray(new Map())).to.be.false
    expect(isTypedArray(new Set())).to.be.false
    expect(isTypedArray(new X())).to.be.false
    expect(isTypedArray({})).to.be.false
  })

  it("should support isObject() function", () => {
    expect(isObject(0)).to.be.false
    expect(isObject({})).to.be.true
    expect(isObject(new X())).to.be.true
  })

  it("should support isPlainObject() function", () => {
    expect(isPlainObject(0)).to.be.false
    expect(isPlainObject({})).to.be.true
    expect(isPlainObject(new X())).to.be.false
  })
})
