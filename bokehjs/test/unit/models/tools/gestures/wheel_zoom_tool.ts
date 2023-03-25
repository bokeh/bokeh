import {expect} from "assertions"
import {display} from "../../../_util"

import {Tool} from "@bokehjs/models/tools/tool"
import {WheelZoomTool, WheelZoomToolView} from "@bokehjs/models/tools/gestures/wheel_zoom_tool"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Plot, PlotView} from "@bokehjs/models/plots/plot"

describe("WheelZoomTool", () => {

  describe("Model", () => {

    it("should create proper tooltip", () => {
      const tool = new WheelZoomTool()
      expect(tool.tooltip).to.be.equal("Wheel Zoom")

      const x_tool = new WheelZoomTool({dimensions: "width"})
      expect(x_tool.tooltip).to.be.equal("Wheel Zoom (x-axis)")

      const y_tool = new WheelZoomTool({dimensions: "height"})
      expect(y_tool.tooltip).to.be.equal("Wheel Zoom (y-axis)")

      const tool_custom = new WheelZoomTool({description: "My wheel zoom tool"})
      expect(tool_custom.tooltip).to.be.equal("My wheel zoom tool")

      const x_tool_custom = new WheelZoomTool({dimensions: "width", description: "My wheel x-zoom tool"})
      expect(x_tool_custom.tooltip).to.be.equal("My wheel x-zoom tool")

      const y_tool_custom = new WheelZoomTool({dimensions: "height", description: "My wheel y-zoom tool"})
      expect(y_tool_custom.tooltip).to.be.equal("My wheel y-zoom tool")
    })
  })

  describe("View", () => {
    // Note default plot dimensions is 600 x 600 (height x width)
    // This is why zooming at {sx: 300, sy: 300} causes the x/y ranges to zoom equally
    async function mkplot(tool: Tool): Promise<PlotView> {
      const plot = new Plot({
        x_range: new Range1d({start: -1, end: 1}),
        y_range: new Range1d({start: -1, end: 1}),
      })
      plot.add_tools(tool)
      const {view} = await display(plot)
      return view
    }

    it("should zoom in both ranges", async () => {
      const wheel_zoom = new WheelZoomTool()
      const plot_view = await mkplot(wheel_zoom)

      const wheel_zoom_view = plot_view.tool_views.get(wheel_zoom)! as WheelZoomToolView

      // positive delta will zoom in
      const zoom_event = {type: "wheel" as "wheel", sx: 300, sy: 300, delta: 100, ctrl_key: false, shift_key: false, alt_key: false}

      // perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.similar([-0.825958, 0.840707])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.similar([-0.833333, 0.833333])
    })

    it("should zoom out both ranges", async () => {
      const wheel_zoom = new WheelZoomTool()
      const plot_view = await mkplot(wheel_zoom)

      const wheel_zoom_view = plot_view.tool_views.get(wheel_zoom)! as WheelZoomToolView

      // positive delta will zoom out
      const zoom_event = {type: "wheel" as "wheel", sx: 300, sy: 300, delta: -100, ctrl_key: false, shift_key: false, alt_key: false}

      // perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.similar([-1.174041, 1.159292])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.similar([-1.166666, 1.166666])
    })

    it("should zoom the x-axis only because dimensions arg is set", async () => {
      const wheel_zoom = new WheelZoomTool({dimensions: "width"})
      const plot_view = await mkplot(wheel_zoom)

      const wheel_zoom_view = plot_view.tool_views.get(wheel_zoom)! as WheelZoomToolView

      // positive delta will zoom in
      const zoom_event = {type: "wheel" as "wheel", sx: 300, sy: 300, delta: 100, ctrl_key: false, shift_key: false, alt_key: false}

      // perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.similar([-0.825958, 0.840707])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.similar([-1.0, 1.0])
    })

    it("should zoom the x-axis only because sy is off frame", async () => {
      const wheel_zoom = new WheelZoomTool({dimensions: "both"})
      const plot_view = await mkplot(wheel_zoom)

      const wheel_zoom_view = plot_view.tool_views.get(wheel_zoom)! as WheelZoomToolView

      // positive delta will zoom in
      const zoom_event = {type: "wheel" as "wheel", sx: 300, sy: 0, delta: 100, ctrl_key: false, shift_key: false, alt_key: false}

      // perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.similar([-0.825958, 0.840707])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.similar([-1.0, 1.0])
    })

    it("should zoom the y-axis only because dimensions arg is set", async () => {
      const wheel_zoom = new WheelZoomTool({dimensions: "height"})
      const plot_view = await mkplot(wheel_zoom)

      const wheel_zoom_view = plot_view.tool_views.get(wheel_zoom)! as WheelZoomToolView

      // positive delta will zoom in
      const zoom_event = {type: "wheel" as "wheel", sx: 300, sy: 300, delta: 100, ctrl_key: false, shift_key: false, alt_key: false}

      // perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.similar([-1.0, 1.0])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.similar([-0.833333, 0.833333])
    })

    it("should zoom the y-axis only because sx is off frame", async () => {
      const wheel_zoom = new WheelZoomTool({dimensions: "both"})
      const plot_view = await mkplot(wheel_zoom)

      const wheel_zoom_view = plot_view.tool_views.get(wheel_zoom)! as WheelZoomToolView

      // positive delta will zoom in
      const zoom_event = {type: "wheel" as "wheel", sx: 0, sy: 300, delta: 100, ctrl_key: false, shift_key: false, alt_key: false}

      // perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.similar([-1.0, 1.0])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.similar([-0.833333, 0.833333])
    })

    it("should zoom centered around the zoom point", async () => {
      const wheel_zoom = new WheelZoomTool({dimensions: "both"})
      const plot_view = await mkplot(wheel_zoom)

      const wheel_zoom_view = plot_view.tool_views.get(wheel_zoom)! as WheelZoomToolView

      // positive delta will zoom in
      const zoom_event = {type: "wheel" as "wheel", sx: 100, sy: 100, delta: 100, ctrl_key: false, shift_key: false, alt_key: false}

      // perform the tool action
      wheel_zoom_view._scroll(zoom_event)

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.similar([-0.943952, 0.722713])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.similar([-0.720338, 0.946327])
    })
  })
})
