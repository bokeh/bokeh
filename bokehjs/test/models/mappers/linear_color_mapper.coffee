{expect} = require "chai"
utils = require "../../utils"

LinearColorMapper = utils.require("models/mappers/linear_color_mapper").Model


describe "LinearColorMapper._get_values method", ->

  it "Should correctly map values along linear scale with high/low unset", ->
    palette = ["red", "green", "blue"]
    color_mapper = new LinearColorMapper({
        palette: palette 
      })

    vals = color_mapper._get_values([99.999, 67, 50, 32, 0.0001], palette)
    expect(vals).to.be.deep.equal(["blue", "blue", "green", "red", "red"])

    vals = color_mapper._get_values([0.0001, 32, 50, 67, 99.999], palette)
    expect(vals).to.be.deep.equal(["red", "red", "green", "blue", "blue"])

    vals = color_mapper._get_values([1, 2, 3], palette)
    expect(vals).to.be.deep.equal(["red", "green", "blue"])

    vals = color_mapper._get_values([3, 2, 1], palette)
    expect(vals).to.be.deep.equal(["blue", "green", "red"])

    vals = color_mapper._get_values([0, 1, 2], palette)
    expect(vals).to.be.deep.equal(["red", "green", "blue"])

    vals = color_mapper._get_values([2, 1, 0], palette)
    expect(vals).to.be.deep.equal(["blue", "green", "red"])

    vals = color_mapper._get_values([-1, 0, 1], palette)
    expect(vals).to.be.deep.equal(["red", "green", "blue"])

    vals = color_mapper._get_values([1, 0, -1], palette)
    expect(vals).to.be.deep.equal(["blue", "green", "red"])

  it "Should correctly map values along linear scale with high/low set", ->
    palette = ["red", "green", "blue"]
    color_mapper = new LinearColorMapper({
        low: 1
        high: 3
        palette: palette 
      })

    vals = color_mapper._get_values([1, 2, 3], palette)
    expect(vals).to.be.deep.equal(["red", "green", "blue"])

  it "Should correctly map values along linear scale with high/low set in other direction", ->
    palette = ["red", "green", "blue"]
    color_mapper = new LinearColorMapper({
        low: 3
        high: 1
        palette: palette 
      })

    vals = color_mapper._get_values([1, 2, 3], palette)
    expect(vals).to.be.deep.equal(["blue", "green", "red"])
