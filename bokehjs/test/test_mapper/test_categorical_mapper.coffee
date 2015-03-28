{expect} = require "chai"
utils = require "../utils"

{Collections} = utils.require "common/base"

describe "categorical mapper", ->
  mapper = null
  before ->
    mapper = Collections('CategoricalMapper').create(
      source_range: Collections('FactorRange').create
        factors: ['foo', 'bar', 'baz']
      target_range: Collections('Range1d').create
        start: 20, 'end': 80
    )

  it "should map first category to bottom third", ->
    expect(mapper.map_to_target "foo").to.equal 30

  it "should map second category to middle", ->
    expect(mapper.map_to_target "bar").to.equal 50

  it "should map third category to upper third", ->
    expect(mapper.map_to_target "baz").to.equal 70
