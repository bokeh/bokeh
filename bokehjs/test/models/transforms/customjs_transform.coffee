{expect} = require "chai"
utils = require "../../utils"

{CustomJSTransform} = utils.require("models/transforms/customjs_transform")
{Range1d} = utils.require("models/ranges/range1d")

describe "customjs_transform module", ->

  describe "default creation", ->
    r = new CustomJSTransform()

    it "should have empty args", ->
      expect(r.args).to.be.deep.equal {}

    it "should have empty func property", ->
      expect(r.func).to.be.equal ""

    it "should have empty v_func property", ->
      expect(r.v_func).to.be.equal ""

  describe "values property", ->

    it "should return an array", ->
      r = new CustomJSTransform()
      expect(r.values).to.be.an.instanceof Array

    it "should contain the args values in order", ->
      rng1 = Range1d()
      rng2 = Range1d()
      r = new CustomJSTransform({args: {foo: rng1, bar: rng2}})
      expect(r.values).to.be.deep.equal([rng1, rng2])

  describe "scalar_transform property", ->

    it "should return a Function", ->
      r = new CustomJSTransform()
      expect(r.scalar_transform).to.be.an.instanceof Function

    it "should have func property as function body", ->
      r = new CustomJSTransform({func: "return x"})
      f = new Function("x", "require", "exports", "return x")
      expect(r.scalar_transform.toString()).to.be.equal(f.toString())

    it "should include args values in order in function signature", ->
      rng1 = Range1d()
      rng2 = Range1d()
      r = new CustomJSTransform({args: {foo: rng1, bar: rng2}, func: "return x"})
      f = new Function("foo", "bar", "x", "require", "exports", "return x")
      expect(r.scalar_transform.toString()).to.be.equal(f.toString())

  describe "vector_transform property", ->

    it "should return a Function", ->
      r = new CustomJSTransform()
      expect(r.vector_transform).to.be.an.instanceof Function

    it "should have v_func property as function body", ->
      r = new CustomJSTransform({v_func: "return xs"})
      f = new Function("xs", "require", "exports", "return xs")
      expect(r.vector_transform.toString()).to.be.equal(f.toString())

    it "should include args values in order in function signature", ->
      rng1 = Range1d()
      rng2 = Range1d()
      r = new CustomJSTransform({args: {foo: rng1, bar: rng2}, v_func: "return xs"})
      f = new Function("foo", "bar", "xs", "require", "exports", "return xs")
      expect(r.vector_transform.toString()).to.be.equal(f.toString())

  describe "compute method", ->

    it "should properly transform a single value", ->
      r = new CustomJSTransform({func: "return x + 10"})
      expect(r.compute(5)).to.be.equal(15)

    it "should properly transform a single value using an arg property", ->
      rng = new Range1d({start: 11, end: 21})
      r = new CustomJSTransform({args: {foo: rng}, func: "return x + foo.start"})
      expect(r.compute(5)).to.be.equal(16)

  describe "v_compute method", ->

    it "should properly transform an array of values", ->
      v_func = """
      new_xs = new Array(xs.length)
      for (i = 0; i < xs.length; i++) {
          new_xs[i] = xs[i] + 10
      }
      return new_xs
      """
      r = new CustomJSTransform({v_func: v_func})
      expect(r.v_compute([1,2,3])).to.be.deep.equal(new Array(11,12,13))

    it "should properly transform an array of values using an arg property", ->
      v_func = """
      new_xs = new Array(xs.length)
      for(i = 0; i < xs.length; i++) {
          new_xs[i] = xs[i] + foo.start
      }
      return new_xs
      """
      rng = new Range1d({start: 11, end: 21})
      r = new CustomJSTransform({args: {foo: rng}, v_func: v_func})
      expect(r.v_compute([1,2,3])).to.be.deep.equal(new Array(12,13,14))
