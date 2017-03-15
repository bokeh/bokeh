{expect} = require "chai"
utils = require "../../utils"

{CustomJSTransform} = utils.require("models/transforms/customjs_transform")
{Range1d} = utils.require("models/ranges/range1d")

describe "customjs_transform module", ->

  describe "default creation", ->
    r = new CustomJSTransform()

    it "should have empty args", ->
      expect(r.args).to.be.deep.equal {}

    it "should have empty code property", ->
      expect(r.code).to.be.equal ""

  describe "values property", ->

    it "should return an array", ->
      r = new CustomJSTransform()
      expect(r.values).to.be.an.instanceof Array

    it "should contain the args values in order", ->
      rng1 = Range1d()
      rng2 = Range1d()
      r = new CustomJSTransform({args: {foo: rng1, bar: rng2}})
      expect(r.values).to.be.deep.equal([rng1, rng2])

  describe "func property", ->

    it "should return a Function", ->
      r = new CustomJSTransform()
      expect(r.func).to.be.an.instanceof Function

    it "should have code property as function body", ->
      r = new CustomJSTransform({code: "return x + 10"})
      f = new Function("require", "x", "return x + 10")
      expect(r.func.toString()).to.be.equal(f.toString())

    it "should include args values in order in function signature", ->
      rng1 = Range1d()
      rng2 = Range1d()
      r = new CustomJSTransform({args: {foo: rng1, bar: rng2}, code: "return x + 10"})
      f = new Function("foo", "bar", "require", "x", "return x + 10")
      expect(r.func.toString()).to.be.equal(f.toString())

  describe "compute method", ->

    it "should properly transform a single value", ->
      r = new CustomJSTransform({code: "return x + 10"})
      expect(r.compute(5)).to.be.equal(15)

    it "should properly transform a single value using an arg property", ->
      rng = new Range1d({start: 11, end: 21})
      r = new CustomJSTransform({args: {foo: rng}, code: "return x + foo.start"})
      expect(r.compute(5)).to.be.equal(16)

  describe "v_compute method", ->

    it "should properly transform an array of values", ->
      r = new CustomJSTransform({code: "return x + 10"})
      expect(r.v_compute([1,2,3])).to.be.deep.equal(new Float64Array([11,12,13]))

    it "should properly transform an array of values using an arg property", ->
      rng = new Range1d({start: 11, end: 21})
      r = new CustomJSTransform({args: {foo: rng}, code: "return x + foo.start"})
      expect(r.v_compute([1,2,3])).to.be.deep.equal(new Float64Array([12,13,14]))
