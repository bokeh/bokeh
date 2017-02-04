{expect} = require "chai"
utils = require "../../../utils"

{CrosshairTool} = utils.require("models/tools/inspectors/crosshair_tool")
{DataRange1d} = utils.require("models/ranges/data_range1d")
{Range1d} = utils.require("models/ranges/range1d")
{PlotCanvas} = utils.require("models/plots/plot_canvas")
{Plot} = utils.require("models/plots/plot")
{PlotView} = utils.require("models/plots/plot")
{Toolbar} = utils.require("models/tools/toolbar")

describe "Crosshair Tool", ->

  describe "Model", ->

    beforeEach ->
      @x_range = new Range1d({start: 0, end:10})
      @y_range = new Range1d({start: 0, end: 10})
      toolbar = new Toolbar()
      @p = new Plot({x_range: @x_range, y_range: @y_range, toolbar: toolbar})

    it "should add two new spans to the plot_canvas synthetic_renderers", ->
      crosshair = new CrosshairTool({plot: @p})
      spans = [crosshair.spans.width, crosshair.spans.height]
      # Plot canvas should now have the two cross hair span renderers
      expect(crosshair.synthetic_renderers).to.be.deep.equal spans
