{expect} = require "chai"
utils = require "../../utils"

{CustomJSTransform} = utils.require("models/transforms/customjs_transform")

describe "customjs_transform module", ->

  describe "default creation", ->
    r = new CustomJSTransform()

    # it "should have empty args", ->
    #   expect(r.args).to.be.deep.equal {}

    it "should have empty code property", ->
      expect(r.code).to.be.equal ""

  describe "func property", ->

    it "should return a Function", ->
      r = new CustomJSTransform()
      expect(r.func).to.be.an.instanceof Function

    it "should have code property as function body", ->
      r = new CustomJSTransform({code: "return x + 10"})
      f = new Function("x", "return x + 10")
      expect(r.func.toString()).to.be.equal f.toString()

  describe "compute method", ->

    it "should modify stuff", ->
      r = new CustomJSTransform({code: "return x + 10"})
      expect(r.compute(5)).to.be.equal(15)

  describe "v_compute method", ->

    it "should also modify stuff", ->
      r = new CustomJSTransform({code: "return x + 10"})
      expect(r.v_compute([1,2,3])).to.be.deep.equal(new Float64Array([11,12,13]))
