_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"

LayoutDOM = utils.require("models/layouts/layout_dom").Model
{Variable}  = utils.require("core/layout/solver")

describe "LayoutDOM.Model", ->

  it "should have 6 variables", ->
    l = new LayoutDOM()
    expect(l._top).to.be.an.instanceOf(Variable)
    expect(l._bottom).to.be.an.instanceOf(Variable)
    expect(l._left).to.be.an.instanceOf(Variable)
    expect(l._right).to.be.an.instanceOf(Variable)
    expect(l._width).to.be.an.instanceOf(Variable)
    expect(l._height).to.be.an.instanceOf(Variable)


  it "should should return 4 constraints", ->
    p = new LayoutDOM()
    expect(p.get_constraints().length).to.be.equal 4

