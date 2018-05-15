{expect} = require "chai"

{Document} = require("document")
{ZoomInTool} = require("models/tools/actions/zoom_in_tool")
{Range1d} = require("models/ranges/range1d")
{Plot} = require("models/plots/plot")
{Toolbar} = require("models/tools/toolbar")

describe "ZoomInTool", ->

  describe "Model", ->

    it "should create proper tooltip", ->
      tool = new ZoomInTool()
      expect(tool.tooltip).to.be.equal('Zoom In')

      x_tool = new ZoomInTool({dimensions: 'width'})
      expect(x_tool.tooltip).to.be.equal('Zoom In (x-axis)')

      y_tool = new ZoomInTool({dimensions: 'height'})
      expect(y_tool.tooltip).to.be.equal('Zoom In (y-axis)')

  describe "View", ->

    beforeEach ->
      @plot = new Plot({
         x_range: new Range1d({start: -1, end: 1})
         y_range: new Range1d({start: -1, end: 1})
      })
      document = new Document()
      document.add_root(@plot)
      @plot_view = new @plot.default_view({model: @plot, parent: null})
      @plot_view.layout()

      @plot_canvas_view = @plot_view.plot_canvas_view

    it "should zoom into both ranges", ->
      zoom_in_tool = new ZoomInTool()
      @plot.add_tools(zoom_in_tool)

      zoom_in_tool_view = @plot_canvas_view.tool_views[zoom_in_tool.id]

      # perform the tool action
      zoom_in_tool_view.doit()

      hr = @plot_canvas_view.frame.x_ranges['default']
      expect([hr.start, hr.end]).to.be.deep.equal([-0.9, 0.9])
      vr = @plot_canvas_view.frame.y_ranges['default']
      expect([vr.start, vr.end]).to.be.deep.equal([-0.9, 0.9])

    it "should zoom the x-axis only", ->
      zoom_in_tool = new ZoomInTool({dimensions: 'width'})
      @plot.add_tools(zoom_in_tool)

      zoom_in_tool_view = @plot_canvas_view.tool_views[zoom_in_tool.id]

      # perform the tool action
      zoom_in_tool_view.doit()

      hr = @plot_canvas_view.frame.x_ranges['default']
      expect([hr.start, hr.end]).to.be.deep.equal([-0.9, 0.9])
      vr = @plot_canvas_view.frame.y_ranges['default']
      expect([vr.start, vr.end]).to.be.deep.equal([-1.0, 1.0])

    it "should zoom the y-axis only", ->
      zoom_in_tool = new ZoomInTool({dimensions: 'height'})
      @plot.add_tools(zoom_in_tool)

      zoom_in_tool_view = @plot_canvas_view.tool_views[zoom_in_tool.id]

      # perform the tool action
      zoom_in_tool_view.doit()

      hr = @plot_canvas_view.frame.x_ranges['default']
      expect([hr.start, hr.end]).to.be.deep.equal([-1.0, 1.0])
      vr = @plot_canvas_view.frame.y_ranges['default']
      expect([vr.start, vr.end]).to.be.deep.equal([-0.9, 0.9])
