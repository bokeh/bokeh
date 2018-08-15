{expect} = require "chai"

{Document} = require("document")
{Widget} = require("models/widgets/widget")

describe "Widget", ->

  it "should should return 8 constraints", ->
    w = new Widget()
