{expect} = require "chai"
utils = require "../../utils"

Row = utils.require("models/layouts/row").Model

describe "Row.Model", ->

  it "should have _horizontal set to true", ->
    r = new Row()
    expect(r._horizontal).to.be.true
