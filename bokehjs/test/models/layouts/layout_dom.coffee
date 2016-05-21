_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"

{Strength, Variable}  = utils.require("core/layout/solver")

LayoutDOM = utils.require("models/layouts/layout_dom").Model


describe "LayoutDOM.Model", ->

  it "should have default variables", ->
    l = new LayoutDOM()
    expect(l._top).to.be.an.instanceOf(Variable)
    expect(l._bottom).to.be.an.instanceOf(Variable)
    expect(l._left).to.be.an.instanceOf(Variable)
    expect(l._right).to.be.an.instanceOf(Variable)
    expect(l._width).to.be.an.instanceOf(Variable)
    expect(l._height).to.be.an.instanceOf(Variable)
    expect(l._dom_top).to.be.an.instanceOf(Variable)
    expect(l._dom_left).to.be.an.instanceOf(Variable)
    expect(l._whitespace_left).to.be.an.instanceOf(Variable)
    expect(l._whitespace_right).to.be.an.instanceOf(Variable)
    expect(l._whitespace_top).to.be.an.instanceOf(Variable)
    expect(l._whitespace_bottom).to.be.an.instanceOf(Variable)

  it "should return 8 constraints", ->
    l = new LayoutDOM()
    expect(l.get_constraints().length).to.be.equal 8

  it "should have have layoutable methods", ->
    l = new LayoutDOM()
    expect(l.get_constraints).is.a 'function'
    expect(l.get_edit_variables).is.a 'function'
    expect(l.get_constrained_variables).is.a 'function'
    expect(l.get_layoutable_children).is.a 'function'

  it "should return default constrained_variables in all responsive modes", ->
    l = new LayoutDOM()
    expected_constrainted_variables = {
      'width': l._width
      'height': l._height
      'origin-x': l._dom_left
      'origin-y': l._dom_top
      # whitespace
      'whitespace-top' : l._whitespace_top
      'whitespace-bottom' : l._whitespace_bottom
      'whitespace-left' : l._whitespace_left
      'whitespace-right' : l._whitespace_right
    }
    l.responsive = 'fixed'
    constrained_variables = l.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrainted_variables
    l.responsive = 'width'
    constrained_variables = l.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrainted_variables
    l.responsive = 'box'
    constrained_variables = l.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrainted_variables

  # TODO(bird) Responsive is WIP
  it.skip "should set edit_variable height if responsive mode is width", ->
    l = new LayoutDOM()
    ev = l.get_edit_variables()
    expect(ev.length).to.be.equal 1
    expect(ev[0].edit_variable).to.be.equal l._height
    expect(ev[0].strength._strength).to.be.equal Strength.strong._strength

  it "should not set edit_variables if responsive mode is box", ->
    l = new LayoutDOM()
    l.responsive = 'box'
    ev = l.get_edit_variables()
    expect(ev.length).to.be.equal 0

  # TODO(bird) Responsive is WIP
  it.skip "should set edit_variable height and width if responsive mode is fixed", ->
    l = new LayoutDOM()
    l.responsive = 'fixed'
    ev = l.get_edit_variables()
    expect(ev.length).to.be.equal 2
    expect(ev[0].edit_variable).to.be.equal l._height
    expect(ev[0].strength._strength).to.be.equal Strength.strong._strength
    expect(ev[1].edit_variable).to.be.equal l._width
    expect(ev[1].strength._strength).to.be.equal Strength.strong._strength
