_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

Plot = utils.require("models/plots/plot").Model
DataRange1d = utils.require("models/ranges/data_range1d").Model
LayoutCanvas = utils.require("core/layout/layout_canvas").Model
LinearAxis = utils.require("models/axes/linear_axis").Model
{Document} = utils.require "document"
{Variable}  = utils.require("core/layout/solver")

# Helper function
_make_axis = (document) ->
  axis = new LinearAxis()
  axis.document = document
  axis._doc_attached()
  return axis


describe "Plot.Model", ->

  it "should have a four LayoutCanvases after _doc_attached is called", ->
    p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d()})
    expect(p.above_panel).to.be.undefined
    expect(p.below_panel).to.be.undefined
    expect(p.left_panel).to.be.undefined
    expect(p.right_panel).to.be.undefined
    p.document = new Document()
    p._doc_attached()
    expect(p.above_panel).to.be.an.instanceOf(LayoutCanvas)
    expect(p.below_panel).to.be.an.instanceOf(LayoutCanvas)
    expect(p.left_panel).to.be.an.instanceOf(LayoutCanvas)
    expect(p.right_panel).to.be.an.instanceOf(LayoutCanvas)

  it "should have panels, frame, and canvas returned in get_layoutable_children", ->
    p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d()})
    p.document = new Document()
    p._doc_attached()
    layoutable_children = p.get_layoutable_children()
    expect(layoutable_children.length).to.be.equal 6
    expect(_.contains(layoutable_children, p.above_panel)).to.be.true
    expect(_.contains(layoutable_children, p.below_panel)).to.be.true
    expect(_.contains(layoutable_children, p.left_panel)).to.be.true
    expect(_.contains(layoutable_children, p.right_panel)).to.be.true
    expect(_.contains(layoutable_children, p.frame)).to.be.true
    expect(_.contains(layoutable_children, p.canvas)).to.be.true

  it "should have axis panels in get_layoutable_children if axes added", ->
    p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d()})
    p.document = new Document()
    p._doc_attached()
    above_axis = _make_axis(p.document)
    below_axis = _make_axis(p.document)
    left_axis = _make_axis(p.document)
    right_axis = _make_axis(p.document)
    p.add_layout(above_axis, 'above')
    p.add_layout(below_axis, 'below')
    p.add_layout(left_axis, 'left')
    p.add_layout(right_axis, 'right')
    layoutable_children = p.get_layoutable_children()
    expect(layoutable_children.length).to.be.equal 10
    expect(_.contains(layoutable_children, above_axis.panel)).to.be.true
    expect(_.contains(layoutable_children, below_axis.panel)).to.be.true
    expect(_.contains(layoutable_children, left_axis.panel)).to.be.true
    expect(_.contains(layoutable_children, right_axis.panel)).to.be.true

  it "should call get_edit_variables on layoutable children", ->
    p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d()})
    p.document = new Document()
    p._doc_attached()
    children = p.get_layoutable_children()
    expect(children.length).to.be.equal 6
    for child in children
      child.get_edit_variables = sinon.spy()
      expect(child.get_edit_variables.callCount).to.be.equal 0
    p.get_edit_variables()
    for child in children
      expect(child.get_edit_variables.callCount).to.be.equal 1

  it "should set min_border_x to value of min_border if min_border_x is not specified", ->
    p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d(), min_border: 33.33})
    p.document = new Document()
    p._doc_attached()
    expect(p.min_border_top).to.be.equal 33.33
    expect(p.min_border_bottom).to.be.equal 33.33
    expect(p.min_border_left).to.be.equal 33.33
    expect(p.min_border_right).to.be.equal 33.33

  it "should set min_border_x to value of specified, and others to value of min_border", ->
    p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d(), min_border: 33.33, min_border_left: 66.66})
    p.document = new Document()
    p._doc_attached()
    expect(p.min_border_top).to.be.equal 33.33
    expect(p.min_border_bottom).to.be.equal 33.33
    expect(p.min_border_left).to.be.equal 66.66
    expect(p.min_border_right).to.be.equal 33.33

  it "should set min_border_x to value of specified, and others to default min_border", ->
    p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d(), min_border_left: 4})
    p.document = new Document()
    p._doc_attached()
    expect(p.min_border_top).to.be.equal 50
    expect(p.min_border_bottom).to.be.equal 50
    expect(p.min_border_left).to.be.equal 4
    expect(p.min_border_right).to.be.equal 50

describe "Plot.Model constraints", ->

  beforeEach ->
    @test_doc = new Document()
    @test_plot = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d()})
    @test_plot.document = @test_doc
    @test_plot._doc_attached()

  it "should return 22 constraints from _get_constant_constraints", ->
    expect(@test_plot._get_constant_constraints().length).to.be.equal 22

  it "should return 0 constraints from _get_side_constraints if there are no side renderers", ->
    expect(@test_plot._get_side_constraints().length).to.be.equal 0

  it "should return 2 constraints from _get_side_constraints if there is one side renderer on above", ->
    expect(@test_plot._get_side_constraints().length).to.be.equal 0
    @test_plot.add_layout(_make_axis(@test_doc), 'above')
    expect(@test_plot._get_side_constraints().length).to.be.equal 2

  it "should return 2 constraints from _get_side_constraints if there is one side renderer on below", ->
    expect(@test_plot._get_side_constraints().length).to.be.equal 0
    @test_plot.add_layout(_make_axis(@test_doc), 'below')
    expect(@test_plot._get_side_constraints().length).to.be.equal 2

  it "should return 2 constraints from _get_side_constraints if there is one side renderer on left", ->
    expect(@test_plot._get_side_constraints().length).to.be.equal 0
    @test_plot.add_layout(_make_axis(@test_doc), 'left')
    expect(@test_plot._get_side_constraints().length).to.be.equal 2

  it "should return 2 constraints from _get_side_constraints if there is one side renderer on right", ->
    expect(@test_plot._get_side_constraints().length).to.be.equal 0
    @test_plot.add_layout(_make_axis(@test_doc), 'right')
    expect(@test_plot._get_side_constraints().length).to.be.equal 2

  it "should return 4 constraints from _get_side_constraints if there are two side renderers", ->
    expect(@test_plot._get_side_constraints().length).to.be.equal 0
    @test_plot.add_layout(_make_axis(@test_doc), 'left')
    @test_plot.add_layout(_make_axis(@test_doc), 'right')
    expect(@test_plot._get_side_constraints().length).to.be.equal 4

  it "should return 3 constraints from _get_side_constraints if there are two side renderers on one side", ->
    expect(@test_plot._get_side_constraints().length).to.be.equal 0
    @test_plot.add_layout(_make_axis(@test_doc), 'left')
    @test_plot.add_layout(_make_axis(@test_doc), 'left')
    expect(@test_plot._get_side_constraints().length).to.be.equal 3

  it "should call _get_side_constraints, _get_constant_constraints", ->
    @test_plot._get_side_constraints = sinon.spy()
    @test_plot._get_constant_constraints = sinon.spy()
    expect(@test_plot._get_side_constraints.callCount).to.be.equal 0
    expect(@test_plot._get_constant_constraints.callCount).to.be.equal 0
    @test_plot.get_constraints()
    expect(@test_plot._get_side_constraints.callCount).to.be.equal 1
    expect(@test_plot._get_constant_constraints.callCount).to.be.equal 1

  it "should call _get_constraints on children", ->
    children = @test_plot.get_layoutable_children()
    expect(children.length).to.be.equal 6
    for child in children
      child.get_constraints = sinon.spy()
      expect(child.get_constraints.callCount).to.be.equal 0
    @test_plot.get_constraints()
    for child in children
      expect(child.get_constraints.callCount).to.be.equal 1
