import {expect} from "assertions"
import {display} from "../../../_util"
import {PlotActions, xy} from "../../../../interactive"

import type {GestureTool} from "@bokehjs/models/tools/gestures/gesture_tool"
import {WheelZoomTool} from "@bokehjs/models/tools/gestures/wheel_zoom_tool"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import type {PlotView} from "@bokehjs/models/plots/plot"
import {Plot} from "@bokehjs/models/plots/plot"
import {LinearAxis} from "@bokehjs/models/axes/linear_axis"
import type {ViewOf} from "@bokehjs/core/view"
import {has_focus} from "@bokehjs/core/dom"
import {figure} from "@bokehjs/api/figure"

const modifiers = {ctrl: false, shift: false, alt: false}

function xy_axis(plot_view: PlotView) {
  const hr = plot_view.frame.x_range
  const vr = plot_view.frame.y_range
  return {
    x: [hr.start, hr.end],
    y: [vr.start, vr.end],
  }
}

// frame dimensions is 300x300, thus zooming at {sx: 150, sy: 150} causes the x/y ranges to zoom equally
async function make_plot<T extends GestureTool>(tool: T): Promise<{view: PlotView, tool_view: ViewOf<T>}> {
  const plot = new Plot({
    x_range: new Range1d({start: -1, end: 1}),
    y_range: new Range1d({start: -1, end: 1}),
    toolbar_location: null,
    min_border: 0,
    frame_width: 300,
    frame_height: 300,
  })
  plot.add_tools(tool)
  plot.toolbar.active_scroll = tool
  plot.add_layout(new LinearAxis(), "below")
  plot.add_layout(new LinearAxis(), "right")
  const {view} = await display(plot)
  const tool_view = view.owner.get_one(tool)
  return {view, tool_view}
}

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

    it("should support auto-activation when modifiers are used", () => {
      const tool0 = new WheelZoomTool({modifiers: {}})
      expect(tool0.supports_auto()).to.be.false

      const tool1 = new WheelZoomTool({modifiers: {alt: true}})
      expect(tool1.supports_auto()).to.be.true

      const tool2 = new WheelZoomTool({modifiers: {ctrl: true}})
      expect(tool2.supports_auto()).to.be.true

      const tool3 = new WheelZoomTool({modifiers: {shift: true}})
      expect(tool3.supports_auto()).to.be.true

      const tool4 = new WheelZoomTool({modifiers: {ctrl: true, shift: true}})
      expect(tool4.supports_auto()).to.be.true
    })
  })

  describe("View", () => {

    it("should zoom in both ranges", async () => {
      const wheel_zoom = new WheelZoomTool()
      const {view, tool_view} = await make_plot(wheel_zoom)

      const zoom_event = {type: "wheel" as const, sx: 150, sy: 150, delta: 100, modifiers, native: new WheelEvent("wheel")}
      tool_view._scroll(zoom_event)

      expect(xy_axis(view)).to.be.similar({
        x: [-0.833333, 0.833333],
        y: [-0.833333, 0.833333],
      })
    })

    it("should zoom out both ranges", async () => {
      const wheel_zoom = new WheelZoomTool()
      const {view, tool_view} = await make_plot(wheel_zoom)

      const zoom_event = {type: "wheel" as const, sx: 150, sy: 150, delta: -100, modifiers, native: new WheelEvent("wheel")}
      tool_view._scroll(zoom_event)

      expect(xy_axis(view)).to.be.similar({
        x: [-1.166666, 1.166666],
        y: [-1.166666, 1.166666],
      })
    })

    it("should zoom the x-axis only because dimensions arg is set", async () => {
      const wheel_zoom = new WheelZoomTool({dimensions: "width"})
      const {view, tool_view} = await make_plot(wheel_zoom)

      const zoom_event = {type: "wheel" as const, sx: 150, sy: 150, delta: 100, modifiers, native: new WheelEvent("wheel")}
      tool_view._scroll(zoom_event)

      expect(xy_axis(view)).to.be.similar({
        x: [-0.833333, 0.833333],
        y: [-1.0, 1.0],
      })
    })

    it("should zoom the y-axis only because dimensions arg is set", async () => {
      const wheel_zoom = new WheelZoomTool({dimensions: "height"})
      const {view, tool_view} = await make_plot(wheel_zoom)

      const zoom_event = {type: "wheel" as const, sx: 150, sy: 150, delta: 100, modifiers, native: new WheelEvent("wheel")}
      tool_view._scroll(zoom_event)

      expect(xy_axis(view)).to.be.similar({
        x: [-1.0, 1.0],
        y: [-0.833333, 0.833333],
      })
    })

    it("should zoom the x-axis only because sy is off frame", async () => {
      const wheel_zoom = new WheelZoomTool({dimensions: "both", zoom_on_axis: true})
      const {view, tool_view} = await make_plot(wheel_zoom)

      const zoom_event = {type: "wheel" as const, sx: 150, sy: 301, delta: 100, modifiers, native: new WheelEvent("wheel")}
      tool_view._scroll(zoom_event)

      expect(xy_axis(view)).to.be.similar({
        x: [-0.833333, 0.833333],
        y: [-1.0, 1.0],
      })
    })

    it("should zoom the y-axis only because sx is off frame", async () => {
      const wheel_zoom = new WheelZoomTool({dimensions: "both", zoom_on_axis: true})
      const {view, tool_view} = await make_plot(wheel_zoom)

      const zoom_event = {type: "wheel" as const, sx: 301, sy: 150, delta: 100, modifiers, native: new WheelEvent("wheel")}
      tool_view._scroll(zoom_event)

      expect(xy_axis(view)).to.be.similar({
        x: [-1.0, 1.0],
        y: [-0.833333, 0.833333],
      })
    })

    it("should zoom centered around the zoom point", async () => {
      const wheel_zoom = new WheelZoomTool({dimensions: "both"})
      const {view, tool_view} = await make_plot(wheel_zoom)

      const zoom_event = {type: "wheel" as const, sx: 50, sy: 50, delta: 100, modifiers, native: new WheelEvent("wheel")}
      tool_view._scroll(zoom_event)

      expect(xy_axis(view)).to.be.similar({
        x: [-0.944444, 0.722222],
        y: [-0.722222, 0.944444],
      })
    })

    it("should not over-zoom when delta is large", async () => {
      const wheel_zoom = new WheelZoomTool({dimensions: "both"})
      const {view, tool_view} = await make_plot(wheel_zoom)

      const zoom_event = {
        type: "wheel" as const,
        sx: 150,
        sy: 150,
        delta: 100000,
        modifiers,
        native: new WheelEvent("wheel"),
      }
      tool_view._scroll(zoom_event)

      expect(xy_axis(view)).to.be.similar({
        x: [-0.05, 0.05],
        y: [-0.05, 0.05],
      })
    })

    it("should not over-zoom when speed is large", async () => {
      const wheel_zoom = new WheelZoomTool({dimensions: "both", speed: 1})
      const {view, tool_view} = await make_plot(wheel_zoom)

      const zoom_event = {
        type: "wheel" as const,
        sx: 150,
        sy: 150,
        delta: 10,
        modifiers,
        native: new WheelEvent("wheel"),
      }
      tool_view._scroll(zoom_event)

      expect(xy_axis(view)).to.be.similar({
        x: [-0.05, 0.05],
        y: [-0.05, 0.05],
      })
    })

    it("should not zoom when modifiers aren't satisfied", async () => {
      const wheel_zoom = new WheelZoomTool({modifiers: {ctrl: true}})
      const {view, tool_view} = await make_plot(wheel_zoom)

      const zoom_event = {
        type: "wheel" as const,
        sx: 150,
        sy: 150,
        delta: 100,
        modifiers: {alt: false, ctrl: false, shift: false},
        native: new WheelEvent("wheel"),
      }
      tool_view._scroll(zoom_event)

      expect(xy_axis(view)).to.be.similar({
        x: [-1.0, 1.0],
        y: [-1.0, 1.0],
      })
    })

    it("should zoom when modifiers are satisfied", async () => {
      const wheel_zoom = new WheelZoomTool({modifiers: {ctrl: true}})
      const {view, tool_view} = await make_plot(wheel_zoom)

      const zoom_event = {
        type: "wheel" as const,
        sx: 150,
        sy: 150,
        delta: 100,
        modifiers: {alt: false, ctrl: true, shift: false},
        native: new WheelEvent("wheel"),
      }
      tool_view._scroll(zoom_event)

      expect(xy_axis(view)).to.be.similar({
        x: [-0.833333, 0.833333],
        y: [-0.833333, 0.833333],
      })
    })
  })

  it("should support auto-activation when active_scroll='auto' and plot has focus", async () => {
    const wheel_zoom = new WheelZoomTool()
    const p = figure({
      frame_width: 200,
      frame_height: 200,
      x_range: [0, 10],
      y_range: [0, 10],
      tools: [wheel_zoom],
      active_scroll: "auto",
      toolbar_location: "right",
    })
    p.scatter([1, 5, 9], [1, 5, 9], {size: 20})

    const {view} = await display(p)
    const actions = new PlotActions(view)

    expect(has_focus(view.canvas_view.events_el)).to.be.false
    expect(wheel_zoom.active).to.be.false

    expect(xy_axis(view)).to.be.equal({x: [0, 10], y: [0, 10]})

    await actions.scroll_up(xy(5, 5))
    await view.ready
    expect(xy_axis(view)).to.be.equal({x: [0, 10], y: [0, 10]})

    view.canvas_view.events_el.focus()
    await view.ready
    expect(has_focus(view.canvas_view.events_el)).to.be.true
    expect(wheel_zoom.active).to.be.true

    await actions.scroll_up(xy(5, 5), 2)
    await view.ready
    expect(xy_axis(view)).to.be.similar({x: [2, 8], y: [2, 8]})

    view.canvas_view.events_el.blur()
    await view.ready
    expect(has_focus(view.canvas_view.events_el)).to.be.false
    expect(wheel_zoom.active).to.be.false

    await actions.scroll_up(xy(5, 5), 2)
    await view.ready
    expect(xy_axis(view)).to.be.similar({x: [2, 8], y: [2, 8]})

    view.canvas_view.events_el.focus()
    await view.ready
    expect(has_focus(view.canvas_view.events_el)).to.be.true
    expect(wheel_zoom.active).to.be.true

    // WheelZoomTool is unable to return to original bounds:
    // https://github.com/bokeh/bokeh/issues/11294
    await actions.scroll_down(xy(5, 5), 2)
    await view.ready
    expect(xy_axis(view)).to.be.similar({x: [0.8, 9.2], y: [0.8, 9.2]})

    view.canvas_view.events_el.blur()
    await view.ready
    expect(has_focus(view.canvas_view.events_el)).to.be.false
    expect(wheel_zoom.active).to.be.false

    await actions.scroll_up(xy(5, 5), 2)
    await view.ready
    expect(xy_axis(view)).to.be.similar({x: [0.8, 9.2], y: [0.8, 9.2]})
  })
})
