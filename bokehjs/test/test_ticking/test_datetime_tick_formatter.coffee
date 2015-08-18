{expect} = require "chai"
utils = require "../utils"

formatter = utils.require "ticking/datetime_tick_formatter"

describe "datetime_tick_formatter module", ->

  it "should retain timezone of date", ->
    d1 = new Date()
    d2 = new Date()
    obj = new formatter.Model
      formats: {"microseconds":["%d-%b %H:%M %Z"]}
    ticks = obj.format([d1, d2])
    expect(ticks[0]).to.not.contain("UTC")
