import {expect} from "assertions"

import {isEqual} from "@bokehjs/core/util/eq"

describe("core/util/eq module", () => {

  it("should support isEqual() function", () => {
    expect(isEqual(0, 0)).to.be.true
    expect(isEqual(0, -0)).to.be.false // true?
    expect(isEqual(-0, 0)).to.be.false // true?
    expect(isEqual(-0, -0)).to.be.true
    expect(isEqual(0, 1)).to.be.false
    expect(isEqual(1, 0)).to.be.false
    expect(isEqual(1, 1)).to.be.true
    expect(isEqual(0, NaN)).to.be.false
    expect(isEqual(NaN, 0)).to.be.false
    expect(isEqual(NaN, NaN)).to.be.true
    expect(isEqual(Infinity, Infinity)).to.be.true
    expect(isEqual(-Infinity, -Infinity)).to.be.true
    expect(isEqual(Infinity, -Infinity)).to.be.false
    expect(isEqual(-Infinity, Infinity)).to.be.false
    expect(isEqual(Infinity, 0)).to.be.false
    expect(isEqual(-Infinity, 0)).to.be.false
    expect(isEqual(0, Infinity)).to.be.false
    expect(isEqual(0, -Infinity)).to.be.false
    expect(isEqual("a", "a")).to.be.true
    expect(isEqual("a", "b")).to.be.false
    expect(isEqual("b", "a")).to.be.false
    expect(isEqual("a", "aa")).to.be.false
    expect(isEqual("aa", "a")).to.be.false

    expect(isEqual(new Map(), [])).to.be.false
    expect(isEqual(new Map(), {})).to.be.false
    expect(isEqual(new Map(), new Map())).to.be.true
    expect(isEqual(new Map(), new Set())).to.be.false
    expect(isEqual(new Map(), new WeakMap())).to.be.false
    expect(isEqual(new Map(), new WeakSet())).to.be.false
    expect(isEqual(new Map(), new Uint8Array())).to.be.false
    expect(isEqual(new Map(), new Uint16Array())).to.be.false
    expect(isEqual(new Map(), new Uint32Array())).to.be.false
    expect(isEqual(new Map(), new Int8Array())).to.be.false
    expect(isEqual(new Map(), new Int16Array())).to.be.false
    expect(isEqual(new Map(), new Int32Array())).to.be.false
    expect(isEqual(new Map(), new Float32Array())).to.be.false
    expect(isEqual(new Map(), new Float64Array())).to.be.false

    expect(isEqual(new Set(), [])).to.be.false
    expect(isEqual(new Set(), {})).to.be.false
    expect(isEqual(new Set(), new Map())).to.be.false
    expect(isEqual(new Set(), new Set())).to.be.true
    expect(isEqual(new Set(), new WeakMap())).to.be.false
    expect(isEqual(new Set(), new WeakSet())).to.be.false
    expect(isEqual(new Set(), new Uint8Array())).to.be.false
    expect(isEqual(new Set(), new Uint16Array())).to.be.false
    expect(isEqual(new Set(), new Uint32Array())).to.be.false
    expect(isEqual(new Set(), new Int8Array())).to.be.false
    expect(isEqual(new Set(), new Int16Array())).to.be.false
    expect(isEqual(new Set(), new Int32Array())).to.be.false
    expect(isEqual(new Set(), new Float32Array())).to.be.false
    expect(isEqual(new Set(), new Float64Array())).to.be.false
  })
})
