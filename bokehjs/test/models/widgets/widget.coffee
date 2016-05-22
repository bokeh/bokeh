{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{Strength, Variable}  = utils.require("core/layout/solver")

{Document} = utils.require("document")
Widget = utils.require("models/widgets/widget").Model


describe "Widget.Model", ->

  it "should should return 8 constraints", ->
    w = new Widget()
    # This is two more than LayoutDOM - we moved some constraints out of
    # LayoutDOM specifically onto Widget.
    expect(w.get_constraints().length).to.be.equal 8
