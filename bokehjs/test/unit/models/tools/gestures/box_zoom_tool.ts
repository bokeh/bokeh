import {expect} from "assertions"
import {display} from "../../../_util"

import type {Tool} from "@bokehjs/models/tools/tool"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Plot} from "@bokehjs/models/plots/plot"
import {BoxZoomTool, PanTool, Toolbar} from "@bokehjs/models"

describe("BoxZoomTool", () => {

  describe("Model", () => {

    it("should create proper tooltip", () => {
      const tool = new BoxZoomTool()
      expect(tool.tooltip).to.be.equal("Box Zoom (either x, y or both dimensions)")

      const x_tool = new BoxZoomTool({dimensions: "width"})
      expect(x_tool.tooltip).to.be.equal("Box Zoom (x-axis)")

      const y_tool = new BoxZoomTool({dimensions: "height"})
      expect(y_tool.tooltip).to.be.equal("Box Zoom (y-axis)")

      const tool_custom = new BoxZoomTool({description: "My box zoom tool"})
      expect(tool_custom.tooltip).to.be.equal("My box zoom tool")

      const x_tool_custom = new BoxZoomTool({dimensions: "width", description: "My box x-zoom tool"})
      expect(x_tool_custom.tooltip).to.be.equal("My box x-zoom tool")

      const y_tool_custom = new BoxZoomTool({dimensions: "height", description: "My box y-zoom tool"})
      expect(y_tool_custom.tooltip).to.be.equal("My box y-zoom tool")
    })
  })

  describe("View", () => {
    async function mkplot(...tools: Tool[]) {
      const buttons = tools.map((tool) => tool.tool_button())
      const plot = new Plot({
        x_range: new Range1d({start: -1, end: 1}),
        y_range: new Range1d({start: -1, end: 1}),
        toolbar: new Toolbar({buttons, tools}),
      })
      const {view: plot_view} = await display(plot)
      return {
        plot_view,
        buttons: buttons.map((button) => plot_view.owner.get_one(button)),
      }
    }

    it("test_deselected_by_default_with_pan_tool", async () => {
      const {buttons} = await mkplot(new BoxZoomTool(), new PanTool())
      const [zoom, pan] = buttons
      expect(zoom.class_list.has("bk-active")).to.be.false
      expect(pan.class_list.has("bk-active")).to.be.true
    })

    it("selected_by_default_without_pan_tool", async () => {
      const {buttons} = await mkplot(new BoxZoomTool())
      const [zoom] = buttons
      expect(zoom.class_list.has("bk-active")).to.be.true
    })

    it("can_be_selected_and_deselected", async () => {
      const {buttons, plot_view} = await mkplot(new BoxZoomTool(), new PanTool())
      const [zoom, pan] = buttons

      // Check is not active
      expect(zoom.class_list.has("bk-active")).to.be.false
      expect(pan.class_list.has("bk-active")).to.be.true

      // Click and check is active
      zoom.tap()
      await plot_view.ready

      expect(zoom.model.tool.active).to.be.true
      expect(pan.model.tool.active).to.be.false

      expect(zoom.class_list.has("bk-active")).to.be.true
      expect(pan.class_list.has("bk-active")).to.be.false

      // Click again and check is not active
      zoom.tap()
      await plot_view.ready

      expect(zoom.model.tool.active).to.be.false
      expect(pan.model.tool.active).to.be.false

      expect(zoom.class_list.has("bk-active")).to.be.false
      expect(pan.class_list.has("bk-active")).to.be.false
    })

    it("should zoom in both ranges", async () => {
      const box_zoom = new BoxZoomTool()
      const {plot_view} = await mkplot(box_zoom)

      const box_zoom_view = plot_view.owner.get_one(box_zoom)

      // perform the tool action
      const zoom_event0 = {type: "pan" as const, sx: 200, sy: 100, dx: 0, dy: 0, scale: 1, modifiers: {ctrl: false, shift: false, alt: false}, native: new PointerEvent("pointermove")}
      box_zoom_view._pan_start(zoom_event0)

      const zoom_event1 = {type: "pan" as const, sx: 400, sy: 500, dx: 0, dy: 0, scale: 1, modifiers: {ctrl: false, shift: false, alt: false}, native: new PointerEvent("pointermove")}
      box_zoom_view._pan_end(zoom_event1)

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.similar([-0.30973, 0.39823])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.similar([-0.67796, 0.67796])
    })

    it("should zoom in with match_aspect", async () => {
      const box_zoom = new BoxZoomTool({match_aspect: true})
      const {plot_view} = await mkplot(box_zoom)

      const box_zoom_view = plot_view.owner.get_one(box_zoom)

      // perform the tool action
      const zoom_event0 = {type: "pan" as const, sx: 200, sy: 200, dx: 0, dy: 0, scale: 1, modifiers: {ctrl: false, shift: false, alt: false}, native: new PointerEvent("pointermove")}
      box_zoom_view._pan_start(zoom_event0)

      const zoom_event1 = {type: "pan" as const, sx: 400, sy: 300, dx: 0, dy: 0, scale: 1, modifiers: {ctrl: false, shift: false, alt: false}, native: new PointerEvent("pointermove")}
      box_zoom_view._pan_end(zoom_event1)

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.similar([-0.30973, 0.39823])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.similar([-0.36898, 0.33898])
    })
  })
})
