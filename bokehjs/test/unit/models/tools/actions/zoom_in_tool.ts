import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"

import type {Tool} from "@bokehjs/models/tools/tool"
import {ZoomInTool} from "@bokehjs/models/tools/actions/zoom_in_tool"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import type {PlotView} from "@bokehjs/models/plots/plot"
import {Plot} from "@bokehjs/models/plots/plot"

describe("ZoomInTool", () => {

  describe("Model", () => {

    it("should create proper tooltip", () => {
      const tool = ZoomInTool.create()
      expect(tool.tooltip).to.be.equal("Zoom In")

      const x_tool = ZoomInTool.create({dimensions: "width"})
      expect(x_tool.tooltip).to.be.equal("Zoom In (x-axis)")

      const y_tool = ZoomInTool.create({dimensions: "height"})
      expect(y_tool.tooltip).to.be.equal("Zoom In (y-axis)")

      const tool_custom = ZoomInTool.create({description: "My zoom in tool"})
      expect(tool_custom.tooltip).to.be.equal("My zoom in tool")

      const x_tool_custom = ZoomInTool.create({dimensions: "width", description: "My x-zoom in tool"})
      expect(x_tool_custom.tooltip).to.be.equal("My x-zoom in tool")

      const y_tool_custom = ZoomInTool.create({dimensions: "height", description: "My y-zoom in tool"})
      expect(y_tool_custom.tooltip).to.be.equal("My y-zoom in tool")
    })
  })

  describe("View", () => {
    // range values chosen to complement zoom_out test as inverse
    async function mkplot(tool: Tool): Promise<PlotView> {
      const plot = Plot.create({
        x_range: Range1d.create({start: -1, end: 1}),
        y_range: Range1d.create({start: -1, end: 1}),
      })
      plot.add_tools(tool)
      const {view} = await display(plot)
      return view
    }

    it("should zoom into both ranges", async () => {
      const zoom_in_tool = ZoomInTool.create()
      const plot_view = await mkplot(zoom_in_tool)

      const zoom_in_tool_view = plot_view.owner.get_one(zoom_in_tool)

      // perform the tool action
      zoom_in_tool_view.doit()

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.similar([-0.9, 0.9])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.similar([-0.9, 0.9])
    })

    it("should zoom the x-axis only", async () => {
      const zoom_in_tool = ZoomInTool.create({dimensions: "width"})
      const plot_view = await mkplot(zoom_in_tool)

      const zoom_in_tool_view = plot_view.owner.get_one(zoom_in_tool)

      // perform the tool action
      zoom_in_tool_view.doit()

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.similar([-0.9, 0.9])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.similar([-1.0, 1.0])
    })

    it("should zoom the y-axis only", async () => {
      const zoom_in_tool = ZoomInTool.create({dimensions: "height"})
      const plot_view = await mkplot(zoom_in_tool)

      const zoom_in_tool_view = plot_view.owner.get_one(zoom_in_tool)

      // perform the tool action
      zoom_in_tool_view.doit()

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.similar([-1.0, 1.0])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.similar([-0.9, 0.9])
    })
  })
})
