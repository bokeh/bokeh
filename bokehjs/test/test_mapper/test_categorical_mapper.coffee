{expect} = require "chai"
utils = require "../utils"

{Collections} = utils.require "common/base"

describe "categorical mapper", ->
  # FIXME Would be nice to randomize the numbers
  factors = ["foo", "bar", "baz"]
  start = 20
  end = 80

  generateMapper = ->
    Collections("CategoricalMapper").create
      source_range: Collections("FactorRange").create factors: factors
      target_range: Collections("Range1d").create start: start, end: end

  testMapping = (key, expected) ->
    mapper = generateMapper()
    expect(mapper.map_to_target key).to.equal expected

  it "should map first category to bottom third", ->
    testMapping "foo", 30

  it "should map second category to middle", ->
    testMapping "bar", 50

  it "should map third category to upper third", ->
    testMapping "baz", 70

  describe "vector mapping", ->
    vectors = generateMapper().v_map_to_target factors
    it "should be an instance of Float64Array", ->
      expect(vectors).to.be.an.instanceof Float64Array

    it "should be evenly distributed", ->
      expect(vectors).to.deep.equal new Float64Array [30, 50, 70]
