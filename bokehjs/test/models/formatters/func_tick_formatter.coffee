{expect} = require "chai"
utils = require "../../utils"

formatter = utils.require "models/formatters/func_tick_formatter"
Range1d = utils.require("models/ranges/range1d").Model

describe "func_tick_formatter module", ->

  it "should format numerical ticks appropriately", ->
    obj = new formatter.Model
      code: "function (x) {return x*10};"

    labels = obj.doFormat([-10, -0.1, 0, 0.1, 10])
    expect(labels).to.deep.equal([-100, -1.0, 0, 1, 100])

  it "should handle args appropriately", ->
    rng = new Range1d()

    # checks that args doesn't cause undeclared var error
    obj = new formatter.Model
      code: "function (x) {return x*10};"
      args: {foo: rng}

    labels = obj.doFormat([-10, -0.1, 0, 0.1, 10])
    expect(labels).to.deep.equal([-100, -1.0, 0, 1, 100])

  it "should format categorical ticks appropriately", ->
    obj = new formatter.Model
      code: "function (y) {return y + '_lat'};"

    labels = obj.doFormat(["a", "b", "c", "d", "e"])
    expect(labels).to.deep.equal(["a_lat", "b_lat", "c_lat", "d_lat", "e_lat"])

  it "should compile coffeescript to javascript correctly", ->
    obj = new formatter.Model
      code: "(tick) -> return tick*10"
      lang: "coffeescript"

    labels = obj.doFormat([-10, -0.1, 0, 0.1, 10])
    expect(labels).to.deep.equal([-100, -1.0, 0, 1, 100])
