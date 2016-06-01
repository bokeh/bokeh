{expect} = require "chai"
utils = require "../../utils"

CartesianFrame = utils.require("models/canvas/cartesian_frame.coffee").Model
{Document} = utils.require "document"
{Variable}  = utils.require("core/layout/solver")

describe "Cartesian.Model", ->

  it "should have 6 variables", ->
    c = new CartesianFrame()
    # These are inherited from LayoutDOM
    expect(c._top).to.be.an.instanceOf(Variable)
    expect(c._bottom).to.be.an.instanceOf(Variable)
    expect(c._left).to.be.an.instanceOf(Variable)
    expect(c._right).to.be.an.instanceOf(Variable)
    expect(c._width).to.be.an.instanceOf(Variable)
    expect(c._height).to.be.an.instanceOf(Variable)


  it "should should return 8 constraints", ->
    c = new CartesianFrame()
    expect(c.get_constraints().length).to.be.equal 8
