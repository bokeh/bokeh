{expect} = require "chai"

{NumeralTickFormatter} = require "models/formatters/numeral_tick_formatter"

describe "numeral_tick_formatter module", ->

  it "should round numbers appropriately", ->
    obj = new NumeralTickFormatter({format: "0.00"})
    labels = obj.doFormat([0.1, 0.01, 0.001, 0.009])
    expect(labels).to.deep.equal(["0.10", "0.01", "0.00", "0.01"])
