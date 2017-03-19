{expect} = require "chai"
utils = require "../../utils"

array = utils.require "core/util/array"

describe "array module", ->

  it "intersection should return array of values in first array found in all others", ->
    a = [0, 1, 2]
    b = [1, 5, 2]
    expect(array.intersection(a, b)).to.deep.equal [1, 2]
