import {expect} from "chai"

import {Document} from "document"
import {Tool} from "models/tools/tool"
import {WheelZoomTool, WheelZoomToolView} from "models/tools/gestures/wheel_zoom_tool"
import {Range1d} from "models/ranges/range1d"
import {Plot, PlotView} from "models/plots/plot"

describe("WheelZoomTool", () => {

  describe("Model", () => {

    it("should create proper tooltip", () => {
      const tool = new WheelZoomTool()
      expect(tool.tooltip).to.be.equal('Wheel Zoom')

      const x_tool = new WheelZoomTool({dimensions: 'width'})
      expect(x_tool.tooltip).to.be.equal('Wheel Zoom (x-axis)')

      const y_tool = new WheelZoomTool({dimensions: 'height'})
      expect(y_tool.tooltip).to.be.equal('Wheel Zoom (y-axis)')
    })
  })

  describe("View", () => {

    // Note default plot dimensions is 600 x 600 (height x width)
    // This is why zooming at {sx: 300, sy: 300} causes the x/y ranges to zoom equally
    function mkplot(tool: Tool): PlotView {
      const plot = new Plot({
        x_range: new Range1d({start: -1, end: 1}),
        y_range: new Range1d({start: -1, end: 1}),
      })
      plot.add_tools(tool)
      const document = new Document()
      document.add_root(plot)
      return new plot.default_view({model: plot, parent: null}).build()
    }

    it("should zoom in both ranges", () => {
      const wheel_zoom = new WheelZoomTool()
      const plot_view = mkplot(wheel_zoom)

      const wheel_zoom_view = plot_view.tool_views[wheel_zoom.id] as WheelZoomToolView

      // positive delta will zoom in
      const zoom_event = {type: "wheel" as "wheel", sx: 300, sy: 300, delta: 100}

      // perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      const hr = plot_view.frame.x_ranges.default
      expect(hr.start).to.be.closeTo(-0.833, 0.01)
      expect(hr.end).to.be.closeTo(0.833, 0.01)

      const vr = plot_view.frame.y_ranges.default
      expect(vr.start).to.be.closeTo(-0.833, 0.01)
      expect(vr.end).to.be.closeTo(0.833, 0.01)
    })

    it("should zoom out both ranges", () => {
      const wheel_zoom = new WheelZoomTool()
      const plot_view = mkplot(wheel_zoom)

      const wheel_zoom_view = plot_view.tool_views[wheel_zoom.id] as WheelZoomToolView

      // positive delta will zoom out
      const zoom_event = {type: "wheel" as "wheel", sx: 300, sy: 300, delta: -100}

      // perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      const hr = plot_view.frame.x_ranges.default
      expect(hr.start).to.be.closeTo(-1.166, 0.01)
      expect(hr.end).to.be.closeTo(1.166, 0.01)

      const vr = plot_view.frame.y_ranges.default
      expect(vr.start).to.be.closeTo(-1.166, 0.01)
      expect(vr.end).to.be.closeTo(1.166, 0.01)
    })

    it("should zoom the x-axis only because dimensions arg is set", () => {
      const wheel_zoom = new WheelZoomTool({dimensions: 'width'})
      const plot_view = mkplot(wheel_zoom)

      const wheel_zoom_view = plot_view.tool_views[wheel_zoom.id] as WheelZoomToolView

      // positive delta will zoom in
      const zoom_event = {type: "wheel" as "wheel", sx: 300, sy: 300, delta: 100}

      // perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      const hr = plot_view.frame.x_ranges.default
      expect(hr.start).to.be.closeTo(-0.833, 0.01)
      expect(hr.end).to.be.closeTo(0.833, 0.01)

      const vr = plot_view.frame.y_ranges.default
      expect([vr.start, vr.end]).to.be.deep.equal([-1.0, 1.0])
    })

    it("should zoom the x-axis only because sy is off frame", () => {
      const wheel_zoom = new WheelZoomTool({dimensions: 'both'})
      const plot_view = mkplot(wheel_zoom)

      const wheel_zoom_view = plot_view.tool_views[wheel_zoom.id] as WheelZoomToolView

      // positive delta will zoom in
      const zoom_event = {type: "wheel" as "wheel", sx: 300, sy: 0, delta: 100}

      // perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      const hr = plot_view.frame.x_ranges.default
      expect(hr.start).to.be.closeTo(-0.833, 0.01)
      expect(hr.end).to.be.closeTo(0.833, 0.01)

      const vr = plot_view.frame.y_ranges.default
      expect([vr.start, vr.end]).to.be.deep.equal([-1.0, 1.0])
    })

    it("should zoom the y-axis only because dimensions arg is set", () => {
      const wheel_zoom = new WheelZoomTool({dimensions: 'height'})
      const plot_view = mkplot(wheel_zoom)

      const wheel_zoom_view = plot_view.tool_views[wheel_zoom.id] as WheelZoomToolView

      // positive delta will zoom in
      const zoom_event = {type: "wheel" as "wheel", sx: 300, sy: 300, delta: 100}

      // perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      const hr = plot_view.frame.x_ranges.default
      expect([hr.start, hr.end]).to.be.deep.equal([-1.0, 1.0])

      const vr = plot_view.frame.y_ranges.default
      expect(vr.start).to.be.closeTo(-0.833, 0.01)
      expect(vr.end).to.be.closeTo(0.833, 0.01)
    })

    it("should zoom the y-axis only because sx is off frame", () => {
      const wheel_zoom = new WheelZoomTool({dimensions: 'both'})
      const plot_view = mkplot(wheel_zoom)

      const wheel_zoom_view = plot_view.tool_views[wheel_zoom.id] as WheelZoomToolView

      // positive delta will zoom in
      const zoom_event = {type: "wheel" as "wheel", sx: 0, sy: 300, delta: 100}

      // perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      const hr = plot_view.frame.x_ranges.default
      expect([hr.start, hr.end]).to.be.deep.equal([-1.0, 1.0])

      const vr = plot_view.frame.y_ranges.default
      expect(vr.start).to.be.closeTo(-0.833, 0.01)
      expect(vr.end).to.be.closeTo(0.833, 0.01)
    })

    it("should zoom centered around the zoom point", () => {
      const wheel_zoom = new WheelZoomTool({dimensions: 'both'})
      const plot_view = mkplot(wheel_zoom)

      const wheel_zoom_view = plot_view.tool_views[wheel_zoom.id] as WheelZoomToolView

      // positive delta will zoom in
      const zoom_event = {type: "wheel" as "wheel", sx: 100, sy: 100, delta: 100}

      // perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      const hr = plot_view.frame.x_ranges.default
      expect(hr.start).to.be.closeTo(-0.945, 0.01)
      expect(hr.end).to.be.closeTo(0.722, 0.01)

      const vr = plot_view.frame.y_ranges.default
      expect(vr.start).to.be.closeTo(-0.722, 0.01)
      expect(vr.end).to.be.closeTo(0.945, 0.01)
    })
  })
})
