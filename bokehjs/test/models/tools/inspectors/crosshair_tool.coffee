_ = require "underscore"
{expect} = require "chai"
utils = require "../../../utils"
sinon = require 'sinon'

CrosshairTool = utils.require("models/tools/inspectors/crosshair_tool.coffee").Model
DataRange1d = utils.require("models/ranges/data_range1d").Model
Range1d = utils.require("models/ranges/range1d").Model
PlotCanvas = utils.require("models/plots/plot_canvas").Model
Plot = utils.require("models/plots/plot").Model
PlotView = utils.require("models/plots/plot").View
Toolbar = utils.require("models/tools/toolbar").Model

describe "Crosshair Tool", ->

  describe "Model", ->

    beforeEach ->
      @x_range = new Range1d({start: 0, end:10})
      @y_range = new Range1d({start: 0, end: 10})
      toolbar = new Toolbar()
      @p = new Plot({x_range: @x_range, y_range: @y_range, toolbar: toolbar})

    it "should add two new spans to the plot_canvas synthetic_renderers", ->
      plot_canvas = @p.plot_canvas
      # Plot canvas has no renderers
      expect(plot_canvas.renderers.length).to.be.equal 0

      crosshair = new CrosshairTool({plot: @p})
      spans = [crosshair.spans.width, crosshair.spans.height]
      # Plot canvas should now have the two cross hair span renderers
      expect(crosshair._computed.synthetic_renderers.getter()).to.be.deep.equal spans
