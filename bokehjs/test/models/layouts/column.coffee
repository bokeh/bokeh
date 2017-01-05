{expect} = require "chai"
utils = require "../../utils"

{Column} = utils.require("models/layouts/column")

describe "Column", ->

  it "should have _horizontal set to false", ->
    c = new Column()
    expect(c._horizontal).to.be.false
