import {expect} from "assertions"

import {Document} from "@bokehjs/document"
import {Tool} from "@bokehjs/models/tools/tool"
import {ZoomInTool} from "@bokehjs/models/tools/actions/zoom_in_tool"
import {ZoomBaseToolView} from "@bokehjs/models/tools/actions/zoom_base_tool"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Plot, PlotView} from "@bokehjs/models/plots/plot"
import {build_view} from "@bokehjs/core/build_views"

describe("ZoomInTool", () => {

  describe("Model", () => {

    it("should create proper tooltip", () => {
      const tool = new ZoomInTool()
      expect(tool.tooltip).to.be.equal('Zoom In')

      const x_tool = new ZoomInTool({dimensions: 'width'})
      expect(x_tool.tooltip).to.be.equal('Zoom In (x-axis)')

      const y_tool = new ZoomInTool({dimensions: 'height'})
      expect(y_tool.tooltip).to.be.equal('Zoom In (y-axis)')
    })
  })

  describe("View", () => {

    async function mkplot(tool: Tool): Promise<PlotView> {
      const plot = new Plot({
        x_range: new Range1d({start: -1, end: 1}),
        y_range: new Range1d({start: -1, end: 1}),
      })
      plot.add_tools(tool)
      const document = new Document()
      document.add_root(plot)
      return (await build_view(plot)).build()
    }

    it("should zoom into both ranges", async () => {
      const zoom_in_tool = new ZoomInTool()
      const plot_view = await mkplot(zoom_in_tool)

      const zoom_in_tool_view = plot_view.tool_views.get(zoom_in_tool)! as ZoomBaseToolView

      // perform the tool action
      zoom_in_tool_view.doit()

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.equal([-0.9, 0.9])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.equal([-0.9, 0.9])
    })

    it("should zoom the x-axis only", async () => {
      const zoom_in_tool = new ZoomInTool({dimensions: 'width'})
      const plot_view = await mkplot(zoom_in_tool)

      const zoom_in_tool_view = plot_view.tool_views.get(zoom_in_tool)! as ZoomBaseToolView

      // perform the tool action
      zoom_in_tool_view.doit()

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.equal([-0.9, 0.9])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.equal([-1.0, 1.0])
    })

    it("should zoom the y-axis only", async () => {
      const zoom_in_tool = new ZoomInTool({dimensions: 'height'})
      const plot_view = await mkplot(zoom_in_tool)

      const zoom_in_tool_view = plot_view.tool_views.get(zoom_in_tool)! as ZoomBaseToolView

      // perform the tool action
      zoom_in_tool_view.doit()

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.equal([-1.0, 1.0])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.equal([-0.9, 0.9])
    })
  })
})
