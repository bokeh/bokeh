{expect} = require "chai"

{Row} = require("models/layouts/row")

describe "Row", ->

  it "should have _horizontal set to true", ->
    r = new Row()
    expect(r._horizontal).to.be.true
