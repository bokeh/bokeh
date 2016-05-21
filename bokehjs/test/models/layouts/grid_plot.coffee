{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

DataRange1d = utils.require("models/ranges/data_range1d").Model
GridPlot = utils.require("models/layouts/grid_plot").Model
Plot = utils.require("models/plots/plot").Model
PlotCanvas = utils.require("models/plots/plot_canvas").Model
Toolbar = utils.require("models/tools/toolbar").Model
{Document} = utils.require "document"

describe "GridPlot.Model", ->
  
  beforeEach ->
    document = new Document()
    @p1 = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d(), toolbar: new Toolbar()})
    @p1.attach_document(document)
    @p2 = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d(), toolbar: new Toolbar()})
    @p2.attach_document(document)
    @grid = new GridPlot({children:[[@p1], [@p2]]})

  it "should have flattened list of children in flat_children", ->
    expect(@grid.flat_children.length).to.be.equal 2
    expect(@grid.flat_children[0]).to.be.equal @p1
    expect(@grid.flat_children[1]).to.be.equal @p2

  it "should have get_layoutable_children return flat_children", ->
    expect(@grid.get_layoutable_children()).to.be.deep.equal @grid.flat_children

  it "should call get_edit_variables on child plots", ->
    children_1 = @p1.get_layoutable_children()
    children_2 = @p2.get_layoutable_children()
    expect(children_1.length).to.be.equal 2
    expect(children_2.length).to.be.equal 2

    # Add spies to child plots
    for child in children_1
      child.get_edit_variables = sinon.spy()
      expect(child.get_edit_variables.callCount).to.be.equal 0
    for child in children_2
      child.get_edit_variables = sinon.spy()
      expect(child.get_edit_variables.callCount).to.be.equal 0

    # Call get_edit_variables on grid_plot
    @grid.get_edit_variables()

    # Confirm child plots were called
    for child in children_1
      expect(child.get_edit_variables.callCount).to.be.equal 1
    for child in children_2
      expect(child.get_edit_variables.callCount).to.be.equal 1

  # TODO(bird) - Need to investigate why this is failing (after getting grid plots
  # working again to some degreee - it is because the child plot doesn't have _sizeable
  # set, which implies that the Plot hasn't been initialized - which is confusing.
  it.skip "should call get_constraints on child plots", ->
    children_1 = @p1.get_layoutable_children()
    children_2 = @p2.get_layoutable_children()
    expect(children_1.length).to.be.equal 2
    expect(children_2.length).to.be.equal 2

    # Add spies to child plots
    for child in children_1
      child.get_constraints = sinon.spy()
      expect(child.get_constraints.callCount).to.be.equal 0
    for child in children_2
      child.get_constraints = sinon.spy()
      expect(child.get_constraints.callCount).to.be.equal 0

    # Call get_constraints on grid_plot
    @grid.get_constraints()

    # Confirm child plots were called
    for child in children_1
      expect(child.get_constraints.callCount).to.be.equal 1
    for child in children_2
      expect(child.get_constraints.callCount).to.be.equal 1
