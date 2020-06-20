import {expect} from "assertions"

import {Document} from "@bokehjs/document"
import {Tool} from "@bokehjs/models/tools/tool"
import {WheelPanTool, WheelPanToolView} from "@bokehjs/models/tools/gestures/wheel_pan_tool"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Plot, PlotView} from "@bokehjs/models/plots/plot"
import {build_view} from "@bokehjs/core/build_views"

describe("WheelPanTool", () => {

  describe("Model", () => {

    it("should create proper tooltip", () => {
      const x_tool = new WheelPanTool({dimension: 'width'})
      expect(x_tool.tooltip).to.be.equal('Wheel Pan (x-axis)')

      const y_tool = new WheelPanTool({dimension: 'height'})
      expect(y_tool.tooltip).to.be.equal('Wheel Pan (y-axis)')
    })
  })

  describe("View", () => {

    async function mkplot(tool: Tool): Promise<PlotView> {
      const plot = new Plot({
        x_range: new Range1d({start: 0, end: 1}),
        y_range: new Range1d({start: 0, end: 1}),
      })
      plot.add_tools(tool)
      const document = new Document()
      document.add_root(plot)
      return (await build_view(plot)).build()
    }

    it("should translate x-range in positive direction", async () => {
      const x_wheel_pan_tool = new WheelPanTool()
      const plot_view = await mkplot(x_wheel_pan_tool)

      const wheel_pan_tool_view = plot_view.tool_views.get(x_wheel_pan_tool)! as WheelPanToolView

      // negative factors move in positive x-data direction
      wheel_pan_tool_view._update_ranges(-0.5)

      const hr = plot_view.frame.x_range
      // should be translated by -factor units
      expect([hr.start, hr.end]).to.be.equal([0.5, 1.5])

      const vr = plot_view.frame.y_range
      // should be unchanged from initialized value
      expect([vr.start, vr.end]).to.be.equal([0, 1])
    })

    it("should translate y-range in negative direction", async () => {
      const x_wheel_pan_tool = new WheelPanTool({dimension: 'height'})
      const plot_view = await mkplot(x_wheel_pan_tool)

      const wheel_pan_tool_view = plot_view.tool_views.get(x_wheel_pan_tool)! as WheelPanToolView

      // positive factors move in positive y-data direction
      wheel_pan_tool_view._update_ranges(0.75)

      const hr = plot_view.frame.x_range
      // should be unchanged from initialized value
      expect([hr.start, hr.end]).to.be.equal([0, 1])

      const vr = plot_view.frame.y_range
      // should be translated by -factor units
      expect([vr.start, vr.end]).to.be.equal([0.75, 1.75])
    })
  })
})
