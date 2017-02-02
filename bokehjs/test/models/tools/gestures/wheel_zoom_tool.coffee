{expect} = require "chai"
utils = require "../../../utils"

{Document} = utils.require("document")
{WheelZoomTool} = utils.require("models/tools/gestures/wheel_zoom_tool")
{Range1d} = utils.require("models/ranges/range1d")
{Plot} = utils.require("models/plots/plot")
{Toolbar} = utils.require("models/tools/toolbar")

describe "WheelZoomTool", ->

  describe "Model", ->

    it "should create proper tooltip", ->
      tool = new WheelZoomTool()
      expect(tool.tooltip).to.be.equal('Wheel Zoom')

      x_tool = new WheelZoomTool({dimensions: 'width'})
      expect(x_tool.tooltip).to.be.equal('Wheel Zoom (x-axis)')

      y_tool = new WheelZoomTool({dimensions: 'height'})
      expect(y_tool.tooltip).to.be.equal('Wheel Zoom (y-axis)')

  describe "View", ->

    afterEach ->
      utils.unstub_canvas()

    beforeEach ->
      utils.stub_canvas()

      # Note default plot dimensions is 600 x 600 (height x width)
      # This is why zooming at {sx: 300, sy: 300} causes the x/y ranges to zoom equally
      @plot = new Plot({
         x_range: new Range1d({start: -1, end: 1})
         y_range: new Range1d({start: -1, end: 1})
      })

      document = new Document()
      document.add_root(@plot)

      @plot_canvas_view = new @plot.plot_canvas.default_view({
        model: @plot.plot_canvas
      })

    it "should zoom in both ranges", ->
      wheel_zoom = new WheelZoomTool()

      @plot.add_tools(wheel_zoom)

      wheel_zoom_view = new wheel_zoom.default_view({
        model: wheel_zoom
        plot_model: @plot.plot_canvas
        plot_view: @plot_canvas_view
      })

      # positive delta will zoom in
      zoom_event = {"bokeh": {sx: 300, sy: 300, delta: 100}}

      # perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      hr = @plot_canvas_view.frame.x_ranges['default']
      expect(hr.start).to.be.closeTo(-0.833, 0.01)
      expect(hr.end).to.be.closeTo(0.833, 0.01)
      vr = @plot_canvas_view.frame.y_ranges['default']
      expect(vr.start).to.be.closeTo(-0.833, 0.01)
      expect(vr.end).to.be.closeTo(0.833, 0.01)

    it "should zoom out both ranges", ->
      wheel_zoom = new WheelZoomTool()

      @plot.add_tools(wheel_zoom)

      wheel_zoom_view = new wheel_zoom.default_view({
        model: wheel_zoom
        plot_model: @plot.plot_canvas
        plot_view: @plot_canvas_view
      })

      # positive delta will zoom out
      zoom_event = {"bokeh": {sx: 300, sy: 300, delta: -100}}

      # perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      hr = @plot_canvas_view.frame.x_ranges['default']
      expect(hr.start).to.be.closeTo(-1.166, 0.01)
      expect(hr.end).to.be.closeTo(1.166, 0.01)
      vr = @plot_canvas_view.frame.y_ranges['default']
      expect(vr.start).to.be.closeTo(-1.166, 0.01)
      expect(vr.end).to.be.closeTo(1.166, 0.01)

    it "should zoom the x-axis only because dimensions arg is set", ->
      wheel_zoom = new WheelZoomTool({dimensions: 'width'})

      @plot.add_tools(wheel_zoom)

      wheel_zoom_view = new wheel_zoom.default_view({
        model: wheel_zoom
        plot_model: @plot.plot_canvas
        plot_view: @plot_canvas_view
      })

      # positive delta will zoom in
      zoom_event = {"bokeh": {sx: 300, sy: 300, delta: 100}}

      # perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      hr = @plot_canvas_view.frame.x_ranges['default']
      expect(hr.start).to.be.closeTo(-0.833, 0.01)
      expect(hr.end).to.be.closeTo(0.833, 0.01)
      vr = @plot_canvas_view.frame.y_ranges['default']
      expect([vr.start, vr.end]).to.be.deep.equal([-1.0, 1.0])

    it "should zoom the x-axis only because sy is off frame", ->
      wheel_zoom = new WheelZoomTool({dimensions: 'both'})

      @plot.add_tools(wheel_zoom)

      wheel_zoom_view = new wheel_zoom.default_view({
        model: wheel_zoom
        plot_model: @plot.plot_canvas
        plot_view: @plot_canvas_view
      })

      # positive delta will zoom in
      zoom_event = {"bokeh": {sx: 300, sy: 0, delta: 100}}

      # perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      hr = @plot_canvas_view.frame.x_ranges['default']
      expect(hr.start).to.be.closeTo(-0.833, 0.01)
      expect(hr.end).to.be.closeTo(0.833, 0.01)
      vr = @plot_canvas_view.frame.y_ranges['default']
      expect([vr.start, vr.end]).to.be.deep.equal([-1.0, 1.0])

    it "should zoom the y-axis only because dimensions arg is set", ->
      wheel_zoom = new WheelZoomTool({dimensions: 'height'})

      @plot.add_tools(wheel_zoom)

      wheel_zoom_view = new wheel_zoom.default_view({
        model: wheel_zoom
        plot_model: @plot.plot_canvas
        plot_view: @plot_canvas_view
      })

      # positive delta will zoom in
      zoom_event = {"bokeh": {sx: 300, sy: 300, delta: 100}}

      # perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      hr = @plot_canvas_view.frame.x_ranges['default']
      expect([hr.start, hr.end]).to.be.deep.equal([-1.0, 1.0])
      vr = @plot_canvas_view.frame.y_ranges['default']
      expect(vr.start).to.be.closeTo(-0.833, 0.01)
      expect(vr.end).to.be.closeTo(0.833, 0.01)

    it "should zoom the y-axis only because sx is off frame", ->
      wheel_zoom = new WheelZoomTool({dimensions: 'both'})

      @plot.add_tools(wheel_zoom)

      wheel_zoom_view = new wheel_zoom.default_view({
        model: wheel_zoom
        plot_model: @plot.plot_canvas
        plot_view: @plot_canvas_view
      })

      # positive delta will zoom in
      zoom_event = {"bokeh": {sx: 0, sy: 300, delta: 100}}

      # perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      hr = @plot_canvas_view.frame.x_ranges['default']
      expect([hr.start, hr.end]).to.be.deep.equal([-1.0, 1.0])
      vr = @plot_canvas_view.frame.y_ranges['default']
      expect(vr.start).to.be.closeTo(-0.833, 0.01)
      expect(vr.end).to.be.closeTo(0.833, 0.01)

    it "should zoom centered around the zoom point", ->
      wheel_zoom = new WheelZoomTool({dimensions: 'both'})

      @plot.add_tools(wheel_zoom)

      wheel_zoom_view = new wheel_zoom.default_view({
        model: wheel_zoom
        plot_model: @plot.plot_canvas
        plot_view: @plot_canvas_view
      })

      # positive delta will zoom in
      zoom_event = {"bokeh": {sx: 100, sy: 100, delta: 100}}

      # perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      hr = @plot_canvas_view.frame.x_ranges['default']
      expect(hr.start).to.be.closeTo(-0.945, 0.01)
      expect(hr.end).to.be.closeTo(0.722, 0.01)
      vr = @plot_canvas_view.frame.y_ranges['default']
      expect(vr.start).to.be.closeTo(-0.722, 0.01)
      expect(vr.end).to.be.closeTo(0.945, 0.01)
