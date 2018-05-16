{expect} = require "chai"

{Document} = require("document")
{BoxZoomTool} = require("models/tools/gestures/box_zoom_tool")
{Range1d} = require("models/ranges/range1d")
{Plot} = require("models/plots/plot")
{Toolbar} = require("models/tools/toolbar")

describe "BoxZoomTool", ->

  describe "Model", ->

    it "should create proper tooltip", ->
      tool = new BoxZoomTool()
      expect(tool.tooltip).to.be.equal('Box Zoom')

      x_tool = new BoxZoomTool({dimensions: 'width'})
      expect(x_tool.tooltip).to.be.equal('Box Zoom (x-axis)')

      y_tool = new BoxZoomTool({dimensions: 'height'})
      expect(y_tool.tooltip).to.be.equal('Box Zoom (y-axis)')

  describe "View", ->

    beforeEach ->
      # Note default plot dimensions is 600 x 600 (height x width)
      @plot = new Plot({
         x_range: new Range1d({start: -1, end: 1})
         y_range: new Range1d({start: -1, end: 1})
      })
      document = new Document()
      document.add_root(@plot)

      @plot_view = new @plot.default_view({model: @plot, parent: null})
      @plot_view.layout()

      @plot_canvas_view = @plot_view.plot_canvas_view

    it "should zoom in both ranges", ->
      box_zoom = new BoxZoomTool()
      @plot.add_tools(box_zoom)

      box_zoom_view = @plot_canvas_view.tool_views[box_zoom.id]

      # perform the tool action
      zoom_event = {sx: 200, sy: 100}
      box_zoom_view._pan_start(zoom_event)

      zoom_event = {sx: 400, sy: 500}
      box_zoom_view._pan_end(zoom_event)

      hr = @plot_canvas_view.frame.x_ranges['default']
      expect(hr.start).to.be.closeTo(-0.31, 0.01)
      expect(hr.end).to.be.closeTo(0.4, 0.01)
      vr = @plot_canvas_view.frame.y_ranges['default']
      expect(vr.start).to.be.closeTo(-0.678, 0.01)
      expect(vr.end).to.be.closeTo(0.678, 0.01)

    it "should zoom in with match_aspect", ->
      box_zoom = new BoxZoomTool({match_aspect: true})
      @plot.add_tools(box_zoom)

      box_zoom_view = @plot_canvas_view.tool_views[box_zoom.id]

      # perform the tool action
      zoom_event = {sx: 200, sy: 200}
      box_zoom_view._pan_start(zoom_event)

      zoom_event = {sx: 400, sy: 300}
      box_zoom_view._pan_end(zoom_event)

      hr = @plot_canvas_view.frame.x_ranges['default']
      expect(hr.start).to.be.closeTo(-0.31, 0.01)
      expect(hr.end).to.be.closeTo(0.4, 0.01)
      vr = @plot_canvas_view.frame.y_ranges['default']
      expect(vr.start).to.be.closeTo(-0.37, 0.01)
      expect(vr.end).to.be.closeTo(0.34, 0.01)
