{expect} = require "chai"
utils = require "../utils"

formatter = utils.require "ticking/numeral_tick_formatter"

describe "numeral_tick_formatter module", ->

  it "should round numbers appropriately", ->
    obj = new formatter.Model
      format: "0.00"
    labels = obj.format([0.1, 0.01, 0.001, 0.009])
    expect(labels).to.deep.equal(["0.10", "0.01", "0.00", "0.01"])
