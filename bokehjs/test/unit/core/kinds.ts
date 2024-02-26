import {expect} from "assertions"

import * as k from "@bokehjs/core/kinds"
import {HasProps} from "@bokehjs/core/has_props"
import {BitSet} from "@bokehjs/core/util/bitset"

class SomeModel extends HasProps {}
class OtherModel extends HasProps {}

describe("core/kinds module", () => {
  it("should support Any kind", () => {
    const tp = k.Any
    expect(`${tp}`).to.be.equal("Any")
    expect(tp.valid(undefined)).to.be.false
    expect(tp.may_have_refs()).to.be.equal(true)
  })

  it("should support Unknown kind", () => {
    const tp = k.Unknown
    expect(`${tp}`).to.be.equal("Unknown")
    expect(tp.valid(undefined)).to.be.false
    expect(tp.may_have_refs()).to.be.equal(true)
  })

  it("should support Bool kind", () => {
    const tp = k.Bool
    expect(`${tp}`).to.be.equal("Bool")
    expect(tp.valid(true)).to.be.true
    expect(tp.valid(false)).to.be.true
    expect(tp.valid(0)).to.be.false
    expect(tp.valid(1)).to.be.false
    expect(tp.valid("a")).to.be.false
    expect(tp.may_have_refs()).to.be.equal(false)
  })

  it("should support Float kind", () => {
    const tp = k.Float
    expect(`${tp}`).to.be.equal("Float")
    expect(tp.valid(0)).to.be.true
    expect(tp.valid(0.1)).to.be.true
    expect(tp.valid("a")).to.be.false
    expect(tp.may_have_refs()).to.be.equal(false)
  })

  it("should support Int kind", () => {
    const tp = k.Int
    expect(`${tp}`).to.be.equal("Int")
    expect(tp.valid(0)).to.be.true
    expect(tp.valid(0.1)).to.be.false
    expect(tp.valid("a")).to.be.false
    expect(tp.may_have_refs()).to.be.equal(false)
  })

  it("should support Bytes kind", () => {
    const tp = k.Bytes
    expect(`${tp}`).to.be.equal("Bytes")
    expect(tp.may_have_refs()).to.be.equal(false)
  })

  it("should support Str kind", () => {
    const tp = k.Str
    expect(`${tp}`).to.be.equal("Str")
    expect(tp.valid(0)).to.be.false
    expect(tp.valid("a")).to.be.true
    expect(tp.may_have_refs()).to.be.equal(false)
  })

  it("should support Regex kind", () => {
    const tp = k.Regex(/^ab*/)
    expect(`${tp}`).to.be.equal("Regex(/^ab*/)")
    expect(tp.valid(0)).to.be.false
    expect(tp.valid("")).to.be.false
    expect(tp.valid("a")).to.be.true
    expect(tp.valid("ab")).to.be.true
    expect(tp.valid("ba")).to.be.false
    expect(tp.may_have_refs()).to.be.equal(false)
  })

  it("should support Null kind", () => {
    const tp = k.Null
    expect(`${tp}`).to.be.equal("Null")
    expect(tp.valid(null)).to.be.true
    expect(tp.valid(undefined)).to.be.false
    expect(tp.valid(0)).to.be.false
    expect(tp.valid(1)).to.be.false
    expect(tp.valid("a")).to.be.false
    expect(tp.may_have_refs()).to.be.equal(false)
  })

  it("should support Nullable kind", () => {
    const tp = k.Nullable(k.Int)
    expect(`${tp}`).to.be.equal("Nullable(Int)")
    expect(tp.valid(null)).to.be.true
    expect(tp.valid(undefined)).to.be.false
    expect(tp.valid(0)).to.be.true
    expect(tp.valid(1)).to.be.true
    expect(tp.valid("a")).to.be.false
    expect(tp.may_have_refs()).to.be.equal(false)
    expect(k.Nullable(k.AnyRef()).may_have_refs()).to.be.equal(true)
  })

  it("should support Opt kind", () => {
    const tp = k.Opt(k.Int)
    expect(`${tp}`).to.be.equal("Opt(Int)")
    expect(tp.valid(null)).to.be.false
    expect(tp.valid(undefined)).to.be.true
    expect(tp.valid(0)).to.be.true
    expect(tp.valid(1)).to.be.true
    expect(tp.valid("a")).to.be.false
    expect(tp.may_have_refs()).to.be.equal(false)
    expect(k.Opt(k.AnyRef()).may_have_refs()).to.be.equal(true)
  })

  it("should support Or kind", () => {
    const tp = k.Or(k.Int, k.Str)
    expect(`${tp}`).to.be.equal("Or(Int, Str)")
    expect(tp.valid(0)).to.be.true
    expect(tp.valid(1)).to.be.true
    expect(tp.valid("a")).to.be.true
    expect(tp.valid(null)).to.be.false
    expect(tp.valid(undefined)).to.be.false
    expect(tp.valid([])).to.be.false
    expect(tp.may_have_refs()).to.be.equal(false)
    expect(k.Or(k.Int, k.AnyRef()).may_have_refs()).to.be.equal(true)
  })

  it("should support Tuple kind", () => {
    const tp = k.Tuple(k.Int, k.Str)
    expect(`${tp}`).to.be.equal("Tuple(Int, Str)")
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
    expect(tp.may_have_refs()).to.be.equal(false)
    expect(k.Tuple(k.Int, k.AnyRef()).may_have_refs()).to.be.equal(true)
  })

  it("should support Struct kind", () => {
    const tp = k.Struct({a: k.Int, b: k.Str, c: k.Opt(k.List(k.Int))})

    expect(`${tp}`).to.be.equal("Struct({a: Int, b: Str, c: Opt(List(Int))})")

    expect(tp.valid({})).to.be.false
    expect(tp.valid({a: 0})).to.be.false
    expect(tp.valid({a: 0, b: "a"})).to.be.true
    expect(tp.valid({a: 0, b: "a", c: [1]})).to.be.true
    expect(tp.valid({a: 0, b: "a", d: [1]})).to.be.false
    expect(tp.valid({a: 0, b: "a", c: [1], d: [1]})).to.be.false

    expect(tp.may_have_refs()).to.be.equal(false)
    const tp1 = k.Struct({a: k.Int, b: k.Str, c: k.Opt(k.List(k.AnyRef()))})
    expect(tp1.may_have_refs()).to.be.equal(true)
  })

  it("should support PartialStruct kind", () => {
    const tp = k.PartialStruct({a: k.Int, b: k.Str, c: k.List(k.Int)})

    expect(`${tp}`).to.be.equal("Struct({a?: Int, b?: Str, c?: List(Int)})")

    expect(tp.valid({})).to.be.true
    expect(tp.valid({a: 0})).to.be.true
    expect(tp.valid({d: 0})).to.be.false
    expect(tp.valid({a: 0, b: "a"})).to.be.true
    expect(tp.valid({a: 0, b: "a", c: [1]})).to.be.true
    expect(tp.valid({a: 0, b: "a", d: [1]})).to.be.false
    expect(tp.valid({a: 0, b: "a", c: [1], d: [1]})).to.be.false

    expect(tp.may_have_refs()).to.be.equal(false)
    const tp1 = k.PartialStruct({a: k.Int, b: k.Str, c: k.Opt(k.List(k.AnyRef()))})
    expect(tp1.may_have_refs()).to.be.equal(true)
  })

  it("should support Iterable kind", () => {
    const tp = k.Iterable(k.Int)
    expect(`${tp}`).to.be.equal("Iterable(Int)")
    expect(tp.valid([])).to.be.true
    expect(tp.valid([0, 1, 2])).to.be.true
    expect(tp.valid(new Set([1, 2, 3]))).to.be.true
    expect(tp.valid((function* () {
      yield 1; yield 2
    })())).to.be.true
    expect(tp.valid([0, "a"])).to.be.true // no item validation
    expect(tp.valid(["a"])).to.be.true    // no item validation

    expect(tp.may_have_refs()).to.be.equal(false)
    expect((k.Iterable(k.AnyRef())).may_have_refs()).to.be.equal(true)
  })

  it("should support Arrayable kind", () => {
    const tp = k.Arrayable(k.Int)
    expect(`${tp}`).to.be.equal("Arrayable(Int)")
    expect(tp.valid([])).to.be.true
    expect(tp.valid([0, 1, 2])).to.be.true
    expect(tp.valid([0, "a"])).to.be.true // no item validation
    expect(tp.valid(["a"])).to.be.true    // no item validation

    expect(tp.may_have_refs()).to.be.equal(false)
    expect((k.Arrayable(k.AnyRef())).may_have_refs()).to.be.equal(true)
  })

  it("should support List kind", () => {
    const tp = k.List(k.Int)
    expect(`${tp}`).to.be.equal("List(Int)")
    expect(tp.valid([])).to.be.true
    expect(tp.valid([0, 1, 2])).to.be.true
    expect(tp.valid([0, "a"])).to.be.false
    expect(tp.valid(["a"])).to.be.false
    expect(tp.may_have_refs()).to.be.equal(false)
    expect((k.List(k.AnyRef())).may_have_refs()).to.be.equal(true)
  })

  it("should support Dict kind", () => {
    const tp = k.Dict(k.Int)
    expect(`${tp}`).to.be.equal("Dict(Int)")
    expect(tp.valid({})).to.be.true
    expect(tp.valid({a: 0})).to.be.true
    expect(tp.valid({a: 0, b: 1})).to.be.true
    expect(tp.valid({a: "a"})).to.be.false
    expect(tp.valid({a: 0, b: "a"})).to.be.false
    expect(tp.may_have_refs()).to.be.equal(false)
    expect((k.Dict(k.AnyRef())).may_have_refs()).to.be.equal(true)
  })

  it("should support Mapping kind", () => {
    const tp = k.Mapping(k.Int, k.Str)
    expect(`${tp}`).to.be.equal("Mapping(Int, Str)")
    expect(tp.valid(new Map())).to.be.true
    expect(tp.valid(new Map([[0, "a"]]))).to.be.true
    expect(tp.valid(new Map([[0, "a"], [1, "b"]]))).to.be.true
    expect(tp.valid(new Map([[0, 1]]))).to.be.false
    expect(tp.may_have_refs()).to.be.equal(false)
    expect((k.Mapping(k.Int, k.AnyRef())).may_have_refs()).to.be.equal(true)
    expect((k.Mapping(k.AnyRef(), k.Int)).may_have_refs()).to.be.equal(true)
  })

  it("should support Set kind", () => {
    const tp = k.Set(k.Int)
    expect(`${tp}`).to.be.equal("Set(Int)")
    expect(tp.valid(new Set())).to.be.true
    expect(tp.valid(new Set([0]))).to.be.true
    expect(tp.valid(new Set([0, 1]))).to.be.true
    expect(tp.valid(new Set(["a"]))).to.be.false
    expect(tp.may_have_refs()).to.be.equal(false)
    expect((k.Set(k.AnyRef())).may_have_refs()).to.be.equal(true)
  })

  it("should support Enum kind", () => {
    const tp = k.Enum("a", "b", "c")
    expect(`${tp}`).to.be.equal("Enum(a, b, c)")
    expect(tp.valid("a")).to.be.true
    expect(tp.valid("b")).to.be.true
    expect(tp.valid("c")).to.be.true
    expect(tp.valid("d")).to.be.false
    expect(tp.valid(1)).to.be.false
    expect(tp.may_have_refs()).to.be.equal(false)
  })

  it("should support Ref kind", () => {
    const tp = k.Ref(SomeModel)
    expect(`${tp}`).to.be.equal("Ref(SomeModel)")
    expect(tp.valid(new SomeModel())).to.be.true
    expect(tp.valid(new OtherModel())).to.be.false
    expect(tp.valid(new class {})).to.be.false
    expect(tp.valid("a")).to.be.false
    expect(tp.valid(1)).to.be.false
    expect(tp.may_have_refs()).to.be.equal(true)
    expect(k.Ref(BitSet).may_have_refs()).to.be.equal(false)
  })

  it("should support AnyRef kind", () => {
    const tp = k.AnyRef()
    expect(`${tp}`).to.be.equal("AnyRef")
    expect(tp.valid(new SomeModel())).to.be.true
    expect(tp.valid(new OtherModel())).to.be.true
    expect(tp.valid(new class {})).to.be.true
    expect(tp.valid("a")).to.be.false
    expect(tp.valid(1)).to.be.false
    expect(tp.may_have_refs()).to.be.equal(true)
  })

  it("should support Func kind", () => {
    const tp = k.Func()
    expect(`${tp}`).to.be.equal("Func(...)")
    expect(tp.valid(() => 1)).to.be.true
    expect(tp.valid(async () => 1)).to.be.true
    expect(tp.valid(function() { return 1 })).to.be.true
    expect(tp.valid(async function() { return 1 })).to.be.true
    expect(tp.valid(new SomeModel())).to.be.false
    expect(tp.valid(new class {})).to.be.false
    expect(tp.valid("a")).to.be.false
    expect(tp.valid(1)).to.be.false
    expect(tp.may_have_refs()).to.be.equal(false)
  })

  it("should support Node kind", () => {
    const tp = k.Node
    expect(`${tp}`).to.be.equal("Node")
    expect(tp.valid(document.createElement("div"))).to.be.true
    expect(tp.valid(new SomeModel())).to.be.false
    expect(tp.valid(new class {})).to.be.false
    expect(tp.valid("a")).to.be.false
    expect(tp.valid(1)).to.be.false
    expect(tp.may_have_refs()).to.be.equal(false)
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

    const tp1 = k.NonNegative(k.Float)
    expect(`${tp1}`).to.be.equal("NonNegative(Float)")
    expect(tp1.valid(-1)).to.be.false
    expect(tp1.valid(0)).to.be.true
    expect(tp1.valid(1)).to.be.true

    expect(tp1.valid(-1.1)).to.be.false
    expect(tp1.valid(0.0)).to.be.true
    expect(tp1.valid(1.1)).to.be.true

    expect(tp0.may_have_refs()).to.be.equal(false)
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

    const tp1 = k.Positive(k.Float)
    expect(`${tp1}`).to.be.equal("Positive(Float)")
    expect(tp1.valid(-1)).to.be.false
    expect(tp1.valid(0)).to.be.false
    expect(tp1.valid(1)).to.be.true

    expect(tp1.valid(-1.1)).to.be.false
    expect(tp1.valid(0.0)).to.be.false
    expect(tp1.valid(1.1)).to.be.true

    expect(tp0.may_have_refs()).to.be.equal(false)
  })

  it("should support deprecated aliases", () => {
    const tp0 = k.Boolean
    expect(`${tp0}`).to.be.equal("Bool")

    const tp1 = k.String
    expect(`${tp1}`).to.be.equal("Str")

    const tp2 = k.Number
    expect(`${tp2}`).to.be.equal("Float")

    const tp3 = k.Array(k.Number)
    expect(`${tp3}`).to.be.equal("List(Float)")

    const tp4 = k.Map(k.Number, k.Boolean)
    expect(`${tp4}`).to.be.equal("Mapping(Float, Bool)")

    const tp5 = k.Function()
    expect(`${tp5}`).to.be.equal("Func(...)")
  })
})
