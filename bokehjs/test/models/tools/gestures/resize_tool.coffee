{expect} = require "chai"
utils = require "../../../utils"
sinon = require 'sinon'

{Document} = utils.require("document")
{ResizeTool} = utils.require("models/tools/gestures/resize_tool")
{ResizeToolView} = utils.require("models/tools/gestures/resize_tool")
{Range1d} = utils.require("models/ranges/range1d")
{Plot} = utils.require("models/plots/plot")
{Toolbar} = utils.require("models/tools/toolbar")

describe "ResizeTool", ->

  describe "View", ->

    afterEach ->
      utils.unstub_canvas()
      utils.unstub_solver()

    beforeEach ->
      utils.stub_canvas()
      utils.stub_solver()

      @x_range = new Range1d({start: 0, end:10})
      @y_range = new Range1d({start: 0, end: 10})
      toolbar = new Toolbar()
      doc = new Document()

      plot = new Plot({x_range: @x_range, y_range: @y_range, toolbar: toolbar})
      doc.add_root(plot)
      @plot_canvas_view = new plot.plot_canvas.default_view({ 'model': plot.plot_canvas })
      @resizetool = new ResizeTool({ plot: plot })
      @resizetool_view = new @resizetool.default_view({
        model: @resizetool
        plot_view: @plot_canvas_view
      })

    it "_update should call plot_view update dimensions", ->
      spy = sinon.spy(@plot_canvas_view, 'update_dimensions')
      expect(spy.callCount).to.be.equal 0
      @resizetool_view._update(100, 200)
      expect(spy.callCount).to.be.equal 1

    it "_update should not call plot_view update dimensions if too small", ->
      spy = sinon.spy(@plot_canvas_view, 'update_dimensions')
      expect(spy.callCount).to.be.equal 0
      @resizetool_view.cw = 10
      @resizetool_view.ch = 10
      @resizetool_view._update(10, 10)
      expect(spy.callCount).to.be.equal 0
