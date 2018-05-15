{expect} = require "chai"
sinon = require "sinon"

{clone} = require("core/util/object")
{Strength, Variable}  = require("core/layout/solver")
{Document} = require("document")
{Box} = require("models/layouts/box")
{BoxView} = require("models/layouts/box")
{LayoutDOMView} = require("models/layouts/layout_dom")

describe "BoxView", ->

  beforeEach ->
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
    new @box.default_view({ model: @box, parent: null })
    expect(spy.callCount).is.equal 1  # Expect one from initialization
    @box.children = [child_box]
    LayoutDOMView.prototype.build_child_views.restore()
    # Expect another two: one from children changing event; the other because
    # we initialize the child_box
    expect(spy.callCount).is.equal 3

describe "Box", ->

  describe "get_editables", ->

    it "should get edit_variables of children", ->
      child1 = new Box(sizing_mode: 'fixed')
      child2 = new Box(sizing_mode: 'fixed')
      parent_box = new Box({children: [child1, child2], sizing_mode: 'fixed'})

      evs = parent_box.get_editables()
      expect(evs.length).to.be.equal(2)

      evs = parent_box.get_all_editables()
      expect(evs.length).to.be.equal(6)

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
        width: @box._width
        height: @box._height
        origin_x: @box._dom_left
        origin_y: @box._dom_top
        whitespace_top : @box._whitespace_top
        whitespace_bottom : @box._whitespace_bottom
        whitespace_left : @box._whitespace_left
        whitespace_right : @box._whitespace_right
        box_equal_size_top : @box._box_equal_size_top
        box_equal_size_bottom : @box._box_equal_size_bottom
        box_equal_size_left : @box._box_equal_size_left
        box_equal_size_right : @box._box_equal_size_right
        box_cell_align_top : @box._box_cell_align_top
        box_cell_align_bottom : @box._box_cell_align_bottom
        box_cell_align_left : @box._box_cell_align_left
        box_cell_align_right : @box._box_cell_align_right
      }

    it "should return correct constrained_variables in stretch_both mode", ->
      @box.sizing_mode = 'stretch_both'
      constrained_variables = @box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal @expected_constrained_variables

    it "should return correct constrained_variables in scale_width mode", ->
      expected_constrained_variables = clone(@expected_constrained_variables)
      delete expected_constrained_variables.height
      @box.sizing_mode = 'scale_width'
      constrained_variables = @box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables

    it "should return correct constrained_variables in scale_height mode", ->
      expected_constrained_variables = clone(@expected_constrained_variables)
      delete expected_constrained_variables.width
      @box.sizing_mode = 'scale_height'
      constrained_variables = @box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables

    it "should return correct constrained_variables in fixed mode", ->
      expected_constrained_variables = clone(@expected_constrained_variables)
      delete expected_constrained_variables.height
      delete expected_constrained_variables.width
      @box.sizing_mode = 'fixed'
      constrained_variables = @box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables
