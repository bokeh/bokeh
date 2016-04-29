{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

Axis = utils.require("models/axes/axis").Model
CanvasView = utils.require("models/canvas/canvas").View
DataRange1d = utils.require("models/ranges/data_range1d").Model
Plot = utils.require("models/plots/plot").Model
PlotView = utils.require("models/plots/plot").View
SidePanel = utils.require("core/layout/side_panel").Model
{Solver} = utils.require("core/layout/solver")
{Document} = utils.require "document"
{Variable}  = utils.require("core/layout/solver")

describe "Axis.Model", ->

  it "should have a SidePanel after _doc_attached is called", ->
    a = new Axis()
    a.document = new Document()
    expect(a.panel).to.be.undefined
    a._doc_attached()
    expect(a.panel).to.be.an.instanceOf(SidePanel)

describe "Axis.View", ->

  beforeEach ->
    sinon.stub(CanvasView.prototype, 'get_ctx', () -> utils.MockContext)
    sinon.stub(Solver.prototype, 'suggest_value')
    sinon.stub(PlotView.prototype, '_paint_empty')

    @test_doc = new Document()
    @test_plot = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d()})
    @test_plot.document = @test_doc
    @test_plot._doc_attached()
    @test_plot_view = new @test_plot.default_view({
      'model': @test_plot
    })
    @test_axis = new Axis()
    @test_axis_view = new @test_axis.default_view({
      'plot_model': @test_plot, 
      'plot_view': @test_plot_view, 
      'model': @test_axis
    })

  it "_tick_extent should return the major_tick_out property", ->
    expect(@test_axis_view._tick_extent()).to.be.equal @test_axis.major_tick_out
