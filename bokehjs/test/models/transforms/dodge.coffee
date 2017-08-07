{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{FactorRange} = utils.require("models/ranges/factor_range")
{Dodge} = utils.require("models/transforms/dodge")

describe "Dodge transform module", ->
  source = {start: 0, end: 10}
  target = {start: 20, end: 80}

  describe "Dodge with uniform", ->
    transform = new Dodge({value: -0.5})

    it "should add value to data", ->
      vals = [-10, -2.5, 0, .2, .5, 10]
      rets = transform.v_compute(vals)
      expect(rets).to.deep.equal new Float64Array([-10.5, -3, -0.5, -0.3, 0, 9.5])

  describe "Dodge with FactorRange", ->
    transform = new Dodge({value: 0.5})
    transform.range = new FactorRange({factors: ["a", "b"]})

    it "should work with a supplied range", ->
      vals =  ["a", "b", "a"]
      rets = transform.v_compute(vals)

      # relies on standard synthetic mapping
      expect(rets).to.deep.equal new Float64Array([1, 2, 1])
