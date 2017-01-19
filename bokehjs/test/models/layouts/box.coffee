_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{Strength, Variable}  = utils.require("core/layout/solver")

{Document} = utils.require("document")
{Box} = utils.require("models/layouts/box")
{BoxView} = utils.require("models/layouts/box")
{LayoutDOMView} = utils.require("models/layouts/layout_dom")

describe "BoxView", ->

  afterEach ->
    utils.unstub_solver()

  beforeEach ->
    solver_stubs = utils.stub_solver()
    @box = new Box()
    @doc = new Document()
    @doc.add_root(@box)

  it.skip "should have a test for get_height", ->
    null

  it.skip "should have a test for get_width", ->
    null

  it "should call build_child_views if children change", ->
    child_box = new Box()
    spy = sinon.spy(LayoutDOMView.prototype, 'build_child_views')
    new @box.default_view({ model: @box })
    expect(spy.callCount).is.equal 1  # Expect one from initialization
    @box.children = [child_box]
    LayoutDOMView.prototype.build_child_views.restore()
    # Expect another two: one from children changing event; the other because
    # we initialize the child_box
    expect(spy.callCount).is.equal 3

describe "Box", ->

  describe "get_edit_variables", ->

    it "should get edit_variables of children", ->
      child1 = new Box(sizing_mode: 'fixed')
      child2 = new Box(sizing_mode: 'fixed')
      parent_box = new Box({children: [child1, child2], sizing_mode: 'fixed'})
      ev = parent_box.get_edit_variables()
      expect(ev.length).to.be.equal 6

      evs = (item.edit_variable for item in ev)
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

    it "should return correct constrained_variables in stretch_both mode", ->
      @box.sizing_mode = 'stretch_both'
      constrained_variables = @box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal @expected_constrained_variables

    it "should return correct constrained_variables in scale_width mode", ->
      expected_constrained_variables = _.omit(@expected_constrained_variables, ['height'])
      @box.sizing_mode = 'scale_width'
      constrained_variables = @box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables

    it "should return correct constrained_variables in scale_height mode", ->
      expected_constrained_variables = _.omit(@expected_constrained_variables, ['width'])
      @box.sizing_mode = 'scale_height'
      constrained_variables = @box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables

    it "should return correct constrained_variables in fixed mode", ->
      expected_constrained_variables = _.omit(@expected_constrained_variables, ['height', 'width'])
      @box.sizing_mode = 'fixed'
      constrained_variables = @box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables
