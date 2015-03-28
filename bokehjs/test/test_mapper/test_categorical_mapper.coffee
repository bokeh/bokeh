{expect} = require "chai"
utils = require "../utils"

{Collections} = utils.require "common/base"

describe "categorical mapper", ->
  factors = ["foo", "bar", "baz"]
  start = 20
  end = 80

  testMapping = (key, expected) ->
    mapper = Collections("CategoricalMapper").create
      source_range: Collections("FactorRange").create factors: factors
      target_range: Collections("Range1d").create start: start, end: end
    expect(mapper.map_to_target key).to.equal expected

  it "should map first category to bottom third", ->
    testMapping "foo", 30

  it "should map second category to middle", ->
    testMapping "bar", 50

  it "should map third category to upper third", ->
    testMapping "baz", 70
