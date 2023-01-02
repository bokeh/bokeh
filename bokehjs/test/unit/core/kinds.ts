import {expect} from "assertions"

import * as k from "@bokehjs/core/kinds"
import {HasProps} from "@bokehjs/core/has_props"

class SomeModel extends HasProps {}
class OtherModel extends HasProps {}

describe("core/kinds module", () => {
  it("should support Any kind", () => {
    const tp = k.Any
    expect(`${tp}`).to.be.equal("Any")
  })

  it("should support Unknown kind", () => {
    const tp = k.Unknown
    expect(`${tp}`).to.be.equal("Unknown")
  })

  it("should support Boolean kind", () => {
    const tp = k.Boolean
    expect(`${tp}`).to.be.equal("Boolean")
    expect(tp.valid(true)).to.be.true
    expect(tp.valid(false)).to.be.true
    expect(tp.valid(0)).to.be.false
    expect(tp.valid(1)).to.be.false
    expect(tp.valid("a")).to.be.false
  })

  it("should support Number kind", () => {
    const tp = k.Number
    expect(`${tp}`).to.be.equal("Number")
    expect(tp.valid(0)).to.be.true
    expect(tp.valid(0.1)).to.be.true
    expect(tp.valid("a")).to.be.false
  })

  it("should support Int kind", () => {
    const tp = k.Int
    expect(`${tp}`).to.be.equal("Int")
    expect(tp.valid(0)).to.be.true
    expect(tp.valid(0.1)).to.be.false
    expect(tp.valid("a")).to.be.false
  })

  it("should support Bytes kind", () => {
    const tp = k.Bytes
    expect(`${tp}`).to.be.equal("Bytes")
  })

  it("should support String kind", () => {
    const tp = k.String
    expect(`${tp}`).to.be.equal("String")
    expect(tp.valid(0)).to.be.false
    expect(tp.valid("a")).to.be.true
  })

  it("should support Regex kind", () => {
    const tp = k.Regex(/^ab*/)
    expect(`${tp}`).to.be.equal("Regex(/^ab*/)")
    expect(tp.valid(0)).to.be.false
    expect(tp.valid("")).to.be.false
    expect(tp.valid("a")).to.be.true
    expect(tp.valid("ab")).to.be.true
    expect(tp.valid("ba")).to.be.false
  })

  it("should support Null kind", () => {
    const tp = k.Null
    expect(`${tp}`).to.be.equal("Null")
    expect(tp.valid(null)).to.be.true
    expect(tp.valid(undefined)).to.be.false
    expect(tp.valid(0)).to.be.false
    expect(tp.valid(1)).to.be.false
    expect(tp.valid("a")).to.be.false
  })

  it("should support Nullable kind", () => {
    const tp = k.Nullable(k.Int)
    expect(`${tp}`).to.be.equal("Nullable(Int)")
    expect(tp.valid(null)).to.be.true
    expect(tp.valid(undefined)).to.be.false
    expect(tp.valid(0)).to.be.true
    expect(tp.valid(1)).to.be.true
    expect(tp.valid("a")).to.be.false
  })

  it("should support Opt kind", () => {
    const tp = k.Opt(k.Int)
    expect(`${tp}`).to.be.equal("Opt(Int)")
    expect(tp.valid(null)).to.be.false
    expect(tp.valid(undefined)).to.be.true
    expect(tp.valid(0)).to.be.true
    expect(tp.valid(1)).to.be.true
    expect(tp.valid("a")).to.be.false
  })

  it("should support Or kind", () => {
    const tp = k.Or(k.Int, k.String)
    expect(`${tp}`).to.be.equal("Or(Int, String)")
    expect(tp.valid(0)).to.be.true
    expect(tp.valid(1)).to.be.true
    expect(tp.valid("a")).to.be.true
    expect(tp.valid(null)).to.be.false
    expect(tp.valid(undefined)).to.be.false
    expect(tp.valid([])).to.be.false
  })

  it("should support Tuple kind", () => {
    const tp = k.Tuple(k.Int, k.String)
    expect(`${tp}`).to.be.equal("Tuple(Int, String)")
    expect(tp.valid([0, "a"])).to.be.true
    expect(tp.valid(["a", 0])).to.be.false
    expect(tp.valid([])).to.be.false
    expect(tp.valid([0])).to.be.false
    expect(tp.valid(["a"])).to.be.false
    expect(tp.valid([0, 0])).to.be.false
    expect(tp.valid(["a", "a"])).to.be.false
    expect(tp.valid(1)).to.be.false
    expect(tp.valid("a")).to.be.false
    expect(tp.valid(null)).to.be.false
    expect(tp.valid(undefined)).to.be.false
  })

  it("should support Struct kind", () => {
    const tp = k.Struct({a: k.Int, b: k.String, c: k.Opt(k.Array(k.Int))})

    expect(`${tp}`).to.be.equal("Struct({a: Int, b: String, c: Opt(Array(Int))})")

    expect(tp.valid({})).to.be.false
    expect(tp.valid({a: 0})).to.be.false
    expect(tp.valid({a: 0, b: "a"})).to.be.true
    expect(tp.valid({a: 0, b: "a", c: [1]})).to.be.true
    expect(tp.valid({a: 0, b: "a", d: [1]})).to.be.false
    expect(tp.valid({a: 0, b: "a", c: [1], d: [1]})).to.be.false
  })

  it("should support PartialStruct kind", () => {
    const tp = k.PartialStruct({a: k.Int, b: k.String, c: k.Array(k.Int)})

    expect(`${tp}`).to.be.equal("Struct({a?: Int, b?: String, c?: Array(Int)})")

    expect(tp.valid({})).to.be.true
    expect(tp.valid({a: 0})).to.be.true
    expect(tp.valid({d: 0})).to.be.false
    expect(tp.valid({a: 0, b: "a"})).to.be.true
    expect(tp.valid({a: 0, b: "a", c: [1]})).to.be.true
    expect(tp.valid({a: 0, b: "a", d: [1]})).to.be.false
    expect(tp.valid({a: 0, b: "a", c: [1], d: [1]})).to.be.false
  })

  it("should support Arrayable kind", () => {
    const tp = k.Arrayable(k.Int)
    expect(`${tp}`).to.be.equal("Arrayable(Int)")
    expect(tp.valid([])).to.be.true
    expect(tp.valid([0, 1, 2])).to.be.true
    expect(tp.valid([0, "a"])).to.be.true // no item validation
    expect(tp.valid(["a"])).to.be.true    // no item validation
  })

  it("should support Array kind", () => {
    const tp = k.Array(k.Int)
    expect(`${tp}`).to.be.equal("Array(Int)")
    expect(tp.valid([])).to.be.true
    expect(tp.valid([0, 1, 2])).to.be.true
    expect(tp.valid([0, "a"])).to.be.false
    expect(tp.valid(["a"])).to.be.false
  })

  it("should support Dict kind", () => {
    const tp = k.Dict(k.Int)
    expect(`${tp}`).to.be.equal("Dict(Int)")
    expect(tp.valid({})).to.be.true
    expect(tp.valid({a: 0})).to.be.true
    expect(tp.valid({a: 0, b: 1})).to.be.true
    expect(tp.valid({a: "a"})).to.be.false
    expect(tp.valid({a: 0, b: "a"})).to.be.false
  })

  it("should support Map kind", () => {
    const tp = k.Map(k.Int, k.String)
    expect(`${tp}`).to.be.equal("Map(Int, String)")
    expect(tp.valid(new Map())).to.be.true
    expect(tp.valid(new Map([[0, "a"]]))).to.be.true
    expect(tp.valid(new Map([[0, "a"], [1, "b"]]))).to.be.true
    expect(tp.valid(new Map([[0, 1]]))).to.be.false
  })

  it("should support Set kind", () => {
    const tp = k.Set(k.Int)
    expect(`${tp}`).to.be.equal("Set(Int)")
    expect(tp.valid(new Set())).to.be.true
    expect(tp.valid(new Set([0]))).to.be.true
    expect(tp.valid(new Set([0, 1]))).to.be.true
    expect(tp.valid(new Set(["a"]))).to.be.false
  })

  it("should support Enum kind", () => {
    const tp = k.Enum("a", "b", "c")
    expect(`${tp}`).to.be.equal("Enum(a, b, c)")
    expect(tp.valid("a")).to.be.true
    expect(tp.valid("b")).to.be.true
    expect(tp.valid("c")).to.be.true
    expect(tp.valid("d")).to.be.false
    expect(tp.valid(1)).to.be.false
  })

  it("should support Ref kind", () => {
    const tp = k.Ref(SomeModel)
    expect(`${tp}`).to.be.equal("Ref(SomeModel)")
    expect(tp.valid(new SomeModel())).to.be.true
    expect(tp.valid(new OtherModel())).to.be.false
    expect(tp.valid(new class {})).to.be.false
    expect(tp.valid("a")).to.be.false
    expect(tp.valid(1)).to.be.false
  })

  it("should support AnyRef kind", () => {
    const tp = k.AnyRef()
    expect(`${tp}`).to.be.equal("AnyRef")
    expect(tp.valid(new SomeModel())).to.be.true
    expect(tp.valid(new OtherModel())).to.be.true
    expect(tp.valid(new class {})).to.be.true
    expect(tp.valid("a")).to.be.false
    expect(tp.valid(1)).to.be.false
  })

  it("should support Function kind", () => {
    const tp = k.Function()
    expect(`${tp}`).to.be.equal("Function(...)")
    expect(tp.valid(() => 1)).to.be.true
    expect(tp.valid(async () => 1)).to.be.true
    expect(tp.valid(function() { return 1 })).to.be.true
    expect(tp.valid(async function() { return 1 })).to.be.true
    expect(tp.valid(new SomeModel())).to.be.false
    expect(tp.valid(new class {})).to.be.false
    expect(tp.valid("a")).to.be.false
    expect(tp.valid(1)).to.be.false
  })

  it("should support DOMNode kind", () => {
    const tp = k.DOMNode
    expect(`${tp}`).to.be.equal("DOMNode")
    expect(tp.valid(document.createElement("div"))).to.be.true
    expect(tp.valid(new SomeModel())).to.be.false
    expect(tp.valid(new class {})).to.be.false
    expect(tp.valid("a")).to.be.false
    expect(tp.valid(1)).to.be.false
  })

  it("should support NonNegative(T) kind", () => {
    const tp0 = k.NonNegative(k.Int)
    expect(`${tp0}`).to.be.equal("NonNegative(Int)")
    expect(tp0.valid(-1)).to.be.false
    expect(tp0.valid(0)).to.be.true
    expect(tp0.valid(1)).to.be.true

    expect(tp0.valid(-1.1)).to.be.false
    expect(tp0.valid(0.0)).to.be.true
    expect(tp0.valid(1.1)).to.be.false

    const tp1 = k.NonNegative(k.Number)
    expect(`${tp1}`).to.be.equal("NonNegative(Number)")
    expect(tp1.valid(-1)).to.be.false
    expect(tp1.valid(0)).to.be.true
    expect(tp1.valid(1)).to.be.true

    expect(tp1.valid(-1.1)).to.be.false
    expect(tp1.valid(0.0)).to.be.true
    expect(tp1.valid(1.1)).to.be.true
  })

  it("should support Positive(T) kind", () => {
    const tp0 = k.Positive(k.Int)
    expect(`${tp0}`).to.be.equal("Positive(Int)")
    expect(tp0.valid(-1)).to.be.false
    expect(tp0.valid(0)).to.be.false
    expect(tp0.valid(1)).to.be.true

    expect(tp0.valid(-1.1)).to.be.false
    expect(tp0.valid(0.0)).to.be.false
    expect(tp0.valid(1.1)).to.be.false

    const tp1 = k.Positive(k.Number)
    expect(`${tp1}`).to.be.equal("Positive(Number)")
    expect(tp1.valid(-1)).to.be.false
    expect(tp1.valid(0)).to.be.false
    expect(tp1.valid(1)).to.be.true

    expect(tp1.valid(-1.1)).to.be.false
    expect(tp1.valid(0.0)).to.be.false
    expect(tp1.valid(1.1)).to.be.true
  })
})
