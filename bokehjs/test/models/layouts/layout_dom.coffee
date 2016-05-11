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

  it "should should return 14 constraints", ->
    l = new LayoutDOM()
    expect(l.get_constraints().length).to.be.equal 16

  it "should should have default dom_left and dom_top", ->
    l = new LayoutDOM()
    expect(l.dom_left).to.be.equal 0
    expect(l.dom_top).to.be.equal 0

  it "should return correct constrained_variables", ->
    l = new LayoutDOM()
    expected_constrainted_variables = {
      'width': l._width
      'height': l._height
      # edges
      'on-top-edge-align' : l._top
      'on-bottom-edge-align' : l._height_minus_bottom
      'on-left-edge-align' : l._left
      'on-right-edge-align' : l._width_minus_right
      # sizing
      'box-equal-size-top' : l._top
      'box-equal-size-bottom' : l._height_minus_bottom
      'box-equal-size-left' : l._left
      'box-equal-size-right' : l._width_minus_right
      # align between cells
      'box-cell-align-top' : l._top
      'box-cell-align-bottom' : l._height_minus_bottom
      'box-cell-align-left' : l._left
      'box-cell-align-right' : l._width_minus_right
      # whitespace
      'whitespace-top' : l._whitespace_top
      'whitespace-bottom' : l._whitespace_bottom
      'whitespace-left' : l._whitespace_left
      'whitespace-right' : l._whitespace_right
    }
    constrained_variables = l.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrainted_variables
