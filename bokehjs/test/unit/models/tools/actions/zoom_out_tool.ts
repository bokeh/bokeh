import {expect} from "assertions"

import {Document} from "@bokehjs/document"
import {Tool} from "@bokehjs/models/tools/tool"
import {ZoomOutTool} from "@bokehjs/models/tools/actions/zoom_out_tool"
import {ZoomBaseToolView} from "@bokehjs/models/tools/actions/zoom_base_tool"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Plot, PlotView} from "@bokehjs/models/plots/plot"
import {build_view} from "@bokehjs/core/build_views"

describe("ZoomOutTool", () => {

  describe("Model", () => {

    it("should create proper tooltip", () => {
      const tool = new ZoomOutTool()
      expect(tool.tooltip).to.be.equal('Zoom Out')

      const x_tool = new ZoomOutTool({dimensions: 'width'})
      expect(x_tool.tooltip).to.be.equal('Zoom Out (x-axis)')

      const y_tool = new ZoomOutTool({dimensions: 'height'})
      expect(y_tool.tooltip).to.be.equal('Zoom Out (y-axis)')
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
      const zoom_out_tool = new ZoomOutTool()
      const plot_view = await mkplot(zoom_out_tool)

      const zoom_out_tool_view = plot_view.tool_views.get(zoom_out_tool)! as ZoomBaseToolView

      // perform the tool action
      zoom_out_tool_view.doit()

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.equal([-1.1, 1.1])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.equal([-1.1, 1.1])
    })

    it("should zoom the x-axis only", async () => {
      const zoom_out_tool = new ZoomOutTool({dimensions: 'width'})
      const plot_view = await mkplot(zoom_out_tool)

      const zoom_out_tool_view = plot_view.tool_views.get(zoom_out_tool)! as ZoomBaseToolView

      // perform the tool action
      zoom_out_tool_view.doit()

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.equal([-1.1, 1.1])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.equal([-1.0, 1.0])
    })

    it("should zoom the y-axis only", async () => {
      const zoom_out_tool = new ZoomOutTool({dimensions: 'height'})
      const plot_view = await mkplot(zoom_out_tool)

      const zoom_out_tool_view = plot_view.tool_views.get(zoom_out_tool)! as ZoomBaseToolView

      // perform the tool action
      zoom_out_tool_view.doit()

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.equal([-1.0, 1.0])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.equal([-1.1, 1.1])
    })
  })
})
