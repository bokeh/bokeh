{expect} = require "chai"
utils = require "../../utils"

{LayoutCanvas} = utils.require("core/layout/layout_canvas")
{Strength, Variable}  = utils.require "core/layout/solver"

describe "LayoutCanvas", ->

  it "should should return no constraints", ->
    c = new LayoutCanvas()
    expect(c.get_constraints().length).to.be.equal 6

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
    ev = c.get_edit_variables()
    expect(ev.length).to.be.equal 4
    variables = []
    for e in ev
      variables.push(e.edit_variable._name)
      expect(e.strength._strength).to.be.equal Strength.strong._strength
    expect("top #{c.id}"    in variables).to.be.true
    expect("left #{c.id}"   in variables).to.be.true
    expect("width #{c.id}"  in variables).to.be.true
    expect("height #{c.id}" in variables).to.be.true
