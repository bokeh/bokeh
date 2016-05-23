_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{Strength, Variable}  = utils.require("core/layout/solver")

{Document} = utils.require("document")
Box = utils.require("models/layouts/box").Model
BoxView = utils.require("models/layouts/box").View

describe "Box.View", ->

  it.skip "should have a test for get_height", ->
    null

describe "Box.Model", ->

  describe "get_edit_variables", ->

    it "should get edit_variables of children", ->
      child1 = new Box(responsive: 'fixed')
      child2 = new Box(responsive: 'fixed')
      parent_box = new Box({children: [child1, child2], responsive: 'fixed'})
      ev = parent_box.get_edit_variables()
      expect(ev.length).to.be.equal 6

      evs = _.pluck(ev, 'edit_variable')
      expect(parent_box._height in evs).is.true
      expect(parent_box._width in evs).is.true
      expect(child1._height in evs).is.true
      expect(child1._width in evs).is.true
      expect(child2._height in evs).is.true
      expect(child2._width in evs).is.true

  describe "get_constrained_variables", ->

    beforeEach ->
      @box = new Box()
      @expected_constrained_variables = {
        'width': @box._width
        'height': @box._height
        'origin-x': @box._dom_left
        'origin-y': @box._dom_top
        'whitespace-top' : @box._whitespace_top
        'whitespace-bottom' : @box._whitespace_bottom
        'whitespace-left' : @box._whitespace_left
        'whitespace-right' : @box._whitespace_right
        'box-equal-size-top' : @box._box_equal_size_top
        'box-equal-size-bottom' : @box._box_equal_size_bottom
        'box-equal-size-left' : @box._box_equal_size_left
        'box-equal-size-right' : @box._box_equal_size_right
        'box-cell-align-top' : @box._box_cell_align_top
        'box-cell-align-bottom' : @box._box_cell_align_bottom
        'box-cell-align-left' : @box._box_cell_align_left
        'box-cell-align-right' : @box._box_cell_align_right
      }

    it "should return correct constrained_variables in box mode", ->
      @box.responsive = 'box'
      constrained_variables = @box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal @expected_constrained_variables

    it "should return correct constrained_variables in width_ar mode", ->
      expected_constrained_variables = _.omit(@expected_constrained_variables, ['height'])
      @box.responsive = 'width_ar'
      constrained_variables = @box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables

    it "should return correct constrained_variables in height_ar mode", ->
      expected_constrained_variables = _.omit(@expected_constrained_variables, ['width'])
      @box.responsive = 'height_ar'
      constrained_variables = @box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables

    it "should return correct constrained_variables in fixed mode", ->
      expected_constrained_variables = _.omit(@expected_constrained_variables, ['height'])
      @box.responsive = 'fixed'
      constrained_variables = @box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables
