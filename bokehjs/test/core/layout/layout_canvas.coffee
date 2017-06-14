{expect} = require "chai"
utils = require "../../utils"

{LayoutCanvas} = utils.require("core/layout/layout_canvas")
{Strength, Variable}  = utils.require "core/layout/solver"

describe "LayoutCanvas", ->

  it "should should return no constraints", ->
    c = new LayoutCanvas()
    expect(c.get_constraints().length).to.be.equal(8)

  it "should get new variables on initialize", ->
    c = new LayoutCanvas()
    expect(c).to.have.property('_top')
    expect(c).to.have.property('_left')
    expect(c).to.have.property('_width')
    expect(c).to.have.property('_height')
    expect(c._top).to.be.an.instanceOf(Variable)
    expect(c._left).to.be.an.instanceOf(Variable)
    expect(c._width).to.be.an.instanceOf(Variable)
    expect(c._height).to.be.an.instanceOf(Variable)

  it "should should return four strong edit variables", ->
    c = new LayoutCanvas()
    ev = c.get_editables()
    expect(ev.length).to.be.equal(2)
