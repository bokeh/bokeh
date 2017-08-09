{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{Strength, Variable}  = utils.require("core/layout/solver")

{Document} = utils.require("document")
{Widget} = utils.require("models/widgets/widget")

describe "Widget", ->

  it "should should return 8 constraints", ->
    w = new Widget()
    # This is two more than LayoutDOM - we moved some constraints out of
    # LayoutDOM specifically onto Widget.
    expect(w.get_all_constraints().length).to.be.equal(8)
