{expect} = require "chai"
utils = require "../../utils"

{Row} = utils.require("models/layouts/row")

describe "Row", ->

  it "should have _horizontal set to true", ->
    r = new Row()
    expect(r._horizontal).to.be.true
