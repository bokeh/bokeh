{expect} = require "chai"

{Strength, Variable}  = require("core/layout/solver")

{Document} = require("document")
{Widget} = require("models/widgets/widget")

describe "Widget", ->

  it "should should return 8 constraints", ->
    w = new Widget()
    # This is two more than LayoutDOM - we moved some constraints out of
    # LayoutDOM specifically onto Widget.
    expect(w.get_all_constraints().length).to.be.equal(8)
