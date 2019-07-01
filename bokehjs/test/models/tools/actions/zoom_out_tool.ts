import {expect} from "chai"

import {Document} from "@bokehjs/document"
import {Tool} from "@bokehjs/models/tools/tool"
import {ZoomOutTool, ZoomOutToolView} from "@bokehjs/models/tools/actions/zoom_out_tool"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Plot, PlotView} from "@bokehjs/models/plots/plot"

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

    it("should zoom into both ranges", () => {
      const zoom_out_tool = new ZoomOutTool()
      const plot_view = mkplot(zoom_out_tool)

      const zoom_out_tool_view = plot_view.tool_views[zoom_out_tool.id] as ZoomOutToolView

      // perform the tool action
      zoom_out_tool_view.doit()

      const hr = plot_view.frame.x_ranges.default
      expect([hr.start, hr.end]).to.be.deep.equal([-1.1, 1.1])

      const vr = plot_view.frame.y_ranges.default
      expect([vr.start, vr.end]).to.be.deep.equal([-1.1, 1.1])
    })

    it("should zoom the x-axis only", () => {
      const zoom_out_tool = new ZoomOutTool({dimensions: 'width'})
      const plot_view = mkplot(zoom_out_tool)

      const zoom_out_tool_view = plot_view.tool_views[zoom_out_tool.id] as ZoomOutToolView

      // perform the tool action
      zoom_out_tool_view.doit()

      const hr = plot_view.frame.x_ranges.default
      expect([hr.start, hr.end]).to.be.deep.equal([-1.1, 1.1])

      const vr = plot_view.frame.y_ranges.default
      expect([vr.start, vr.end]).to.be.deep.equal([-1.0, 1.0])
    })

    it("should zoom the y-axis only", () => {
      const zoom_out_tool = new ZoomOutTool({dimensions: 'height'})
      const plot_view = mkplot(zoom_out_tool)

      const zoom_out_tool_view = plot_view.tool_views[zoom_out_tool.id] as ZoomOutToolView

      // perform the tool action
      zoom_out_tool_view.doit()

      const hr = plot_view.frame.x_ranges.default
      expect([hr.start, hr.end]).to.be.deep.equal([-1.0, 1.0])

      const vr = plot_view.frame.y_ranges.default
      expect([vr.start, vr.end]).to.be.deep.equal([-1.1, 1.1])
    })
  })
})
