import {expect} from "chai"

import {Document} from "@bokehjs/document"
import {Tool} from "@bokehjs/models/tools/tool"
import {ZoomInTool, ZoomInToolView} from "@bokehjs/models/tools/actions/zoom_in_tool"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Plot, PlotView} from "@bokehjs/models/plots/plot"

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
      const zoom_in_tool = new ZoomInTool()
      const plot_view = mkplot(zoom_in_tool)

      const zoom_in_tool_view = plot_view.tool_views[zoom_in_tool.id] as ZoomInToolView

      // perform the tool action
      zoom_in_tool_view.doit()

      const hr = plot_view.frame.x_ranges.default
      expect([hr.start, hr.end]).to.be.deep.equal([-0.9, 0.9])

      const vr = plot_view.frame.y_ranges.default
      expect([vr.start, vr.end]).to.be.deep.equal([-0.9, 0.9])
    })

    it("should zoom the x-axis only", () => {
      const zoom_in_tool = new ZoomInTool({dimensions: 'width'})
      const plot_view = mkplot(zoom_in_tool)

      const zoom_in_tool_view = plot_view.tool_views[zoom_in_tool.id] as ZoomInToolView

      // perform the tool action
      zoom_in_tool_view.doit()

      const hr = plot_view.frame.x_ranges.default
      expect([hr.start, hr.end]).to.be.deep.equal([-0.9, 0.9])

      const vr = plot_view.frame.y_ranges.default
      expect([vr.start, vr.end]).to.be.deep.equal([-1.0, 1.0])
    })

    it("should zoom the y-axis only", () => {
      const zoom_in_tool = new ZoomInTool({dimensions: 'height'})
      const plot_view = mkplot(zoom_in_tool)

      const zoom_in_tool_view = plot_view.tool_views[zoom_in_tool.id] as ZoomInToolView

      // perform the tool action
      zoom_in_tool_view.doit()

      const hr = plot_view.frame.x_ranges.default
      expect([hr.start, hr.end]).to.be.deep.equal([-1.0, 1.0])

      const vr = plot_view.frame.y_ranges.default
      expect([vr.start, vr.end]).to.be.deep.equal([-0.9, 0.9])
    })
  })
})
