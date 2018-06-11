import {expect} from "chai"

import {CustomJSTransform} from "models/transforms/customjs_transform"
import {Range1d} from "models/ranges/range1d"

describe("customjs_transform module", () => {

  describe("default creation", () => {
    const r = new CustomJSTransform({use_strict: true})

    it("should have empty args", () => {
      expect(r.args).to.be.deep.equal({})
    })

    it("should have empty func property", () => {
      expect(r.func).to.be.equal("")
    })

    it("should have empty v_func property", () => {
      expect(r.v_func).to.be.equal("")
    })
  })

  describe("values property", () => {

    it("should return an array", () => {
      const r = new CustomJSTransform({use_strict: true})
      expect(r.values).to.be.an.instanceof(Array)
    })

    it("should contain the args values in order", () => {
      const rng1 = new Range1d()
      const rng2 = new Range1d()
      const r = new CustomJSTransform({args: {foo: rng1, bar: rng2}, use_strict: true})
      expect(r.values).to.be.deep.equal([rng1, rng2])
    })
  })

  describe("scalar_transform property", () => {

    it("should return a Function", () => {
      const r = new CustomJSTransform({use_strict: true})
      expect(r.scalar_transform).to.be.an.instanceof(Function)
    })

    it("should have func property as function body", () => {
      const r = new CustomJSTransform({func: "return x", use_strict: true})
      const f = new Function("x", "require", "exports", "'use strict';\nreturn x")
      expect(r.scalar_transform.toString()).to.be.equal(f.toString())
    })

    it("should include args values in order in function signature", () => {
      const rng1 = new Range1d()
      const rng2 = new Range1d()
      const r = new CustomJSTransform({args: {foo: rng1, bar: rng2}, func: "return x", use_strict: true})
      const f = new Function("foo", "bar", "x", "require", "exports", "'use strict';\nreturn x")
      expect(r.scalar_transform.toString()).to.be.equal(f.toString())
    })
  })

  describe("vector_transform property", () => {

    it("should return a Function", () => {
      const r = new CustomJSTransform({use_strict: true})
      expect(r.vector_transform).to.be.an.instanceof(Function)
    })

    it("should have v_func property as function body", () => {
      const r = new CustomJSTransform({v_func: "return xs", use_strict: true})
      const f = new Function("xs", "require", "exports", "'use strict';\nreturn xs")
      expect(r.vector_transform.toString()).to.be.equal(f.toString())
    })

    it("should include args values in order in function signature", () => {
      const rng1 = new Range1d()
      const rng2 = new Range1d()
      const r = new CustomJSTransform({args: {foo: rng1, bar: rng2}, v_func: "return xs", use_strict: true})
      const f = new Function("foo", "bar", "xs", "require", "exports", "'use strict';\nreturn xs")
      expect(r.vector_transform.toString()).to.be.equal(f.toString())
    })
  })

  describe("compute method", () => {

    it("should properly transform a single value", () => {
      const r = new CustomJSTransform({func: "return x + 10", use_strict: true})
      expect(r.compute(5)).to.be.equal(15)
    })

    it("should properly transform a single value using an arg property", () => {
      const rng = new Range1d({start: 11, end: 21})
      const r = new CustomJSTransform({args: {foo: rng}, func: "return x + foo.start", use_strict: true})
      expect(r.compute(5)).to.be.equal(16)
    })
  })

  describe("v_compute method", () => {

    it("should properly transform an array of values", () => {
      const v_func = `\
var new_xs = new Array(xs.length)
for (var i = 0; i < xs.length; i++) {
  new_xs[i] = xs[i] + 10
}
return new_xs\
`
      const r = new CustomJSTransform({v_func, use_strict: true})
      expect(r.v_compute([1,2,3])).to.be.deep.equal(new Array(11,12,13))
    })

    it("should properly transform an array of values using an arg property", () => {
      const v_func = `\
var new_xs = new Array(xs.length)
for(var i = 0; i < xs.length; i++) {
  new_xs[i] = xs[i] + foo.start
}
return new_xs\
`
      const rng = new Range1d({start: 11, end: 21})
      const r = new CustomJSTransform({args: {foo: rng}, v_func, use_strict: true})
      expect(r.v_compute([1,2,3])).to.be.deep.equal(new Array(12,13,14))
    })
  })
})
