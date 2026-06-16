import {expect} from "#framework/assertions"
import type {XY} from "#framework/interactive"
import {actions, xy} from "#framework/interactive"
import {display} from "#framework/layouts"

import type {Tool} from "@bokehjs/models/tools/tool"
import {PanTool} from "@bokehjs/models/tools/gestures/pan_tool"
import type {PlotView} from "@bokehjs/models/plots/plot"
import {Plot, Range1d, LinearAxis} from "@bokehjs/models"
import {no_repeated} from "@bokehjs/core/util/iterator"
import type {KeyModifiers} from "@bokehjs/core/ui_gestures"

describe("PanTool", () => {

  async function mkplot(tool: Tool): Promise<PlotView> {
    const plot = new Plot({
      width: 400,
      height: 400,
      min_border: 0,
      x_range: new Range1d({start: 0, end: 1}),
      y_range: new Range1d({start: 0, end: 1}),
    })
    plot.add_tools(tool)
    plot.add_layout(new LinearAxis(), "above")
    plot.add_layout(new LinearAxis(), "left")
    const {view} = await display(plot)
    return view
  }

  async function mkplot_with_extra_y(tool: Tool): Promise<PlotView> {
    const plot = new Plot({
      width: 400,
      height: 400,
      min_border: 0,
      x_range: new Range1d({start: 0, end: 1}),
      y_range: new Range1d({start: 0, end: 1}),
    })
    plot.extra_y_ranges = {y2: new Range1d({start: 0, end: 10})}
    plot.add_tools(tool)
    plot.add_layout(new LinearAxis(), "left")
    plot.add_layout(new LinearAxis({y_range_name: "y2"}), "right")
    const {view} = await display(plot)
    return view
  }

  function get_ranges(plot_view: PlotView) {
    const xr  = plot_view.frame.x_range
    const yr  = plot_view.frame.y_range
    const y2r = plot_view.frame.y_ranges.get("y2") as Range1d
    return {
      x:  [xr.start,  xr.end]  as [number, number],
      y:  [yr.start,  yr.end]  as [number, number],
      y2: [y2r.start, y2r.end] as [number, number],
    }
  }

  function get_cursor(plot_view: PlotView): string {
    return getComputedStyle(plot_view.canvas_view.events_el).cursor
  }

  async function expect_cursor(plot_view: PlotView, xy0: XY, xy1: XY, cursor: string): Promise<void> {
    const ac = actions(plot_view, {units: "screen"})
    const cursors: string[] = []
    for await (const _ of ac._emit(ac._pan({type: "line", xy0, xy1, n: 5}))) {
      cursors.push(get_cursor(plot_view))
    }
    expect([...no_repeated(cursors)]).to.be.equal([...no_repeated(["default", cursor, "default"])])
  }

  describe("should support pan_together", () => {
    const modifiers: KeyModifiers = {alt: false, ctrl: false, shift: false}
    const native_ev = new PointerEvent("pointermove")

    it("'all' panning on y-axis moves all y-ranges but not x", async () => {
      const tool = new PanTool({dimensions: "both", pan_together: "all"})
      const plot_view = await mkplot_with_extra_y(tool)
      const tool_view = plot_view.owner.get_one(tool)

      const left_axis = plot_view.axis_views.find((v) => v.panel.side == "left")!
      const {hcenter: sx, vcenter: sy} = left_axis.bbox

      tool_view._pan_start({type: "pan_start", sx, sy, dx: 0, dy: 0, modifiers, native: native_ev})
      tool_view._update(0, 50)
      tool_view._pan_end({type: "pan_end", sx, sy, dx: 0, dy: 50, modifiers, native: native_ev})

      const {x, y, y2} = get_ranges(plot_view)
      expect(x).to.be.equal([0, 1])      // x unchanged
      expect(y).to.not.be.equal([0, 1])  // main y moved
      expect(y2).to.not.be.equal([0, 10]) // extra y2 also moved ("all")
    })

    it("'none' panning on y-axis moves only the clicked y-range", async () => {
      const tool = new PanTool({dimensions: "both", pan_together: "none"})
      const plot_view = await mkplot_with_extra_y(tool)
      const tool_view = plot_view.owner.get_one(tool)

      const left_axis = plot_view.axis_views.find((v) => v.panel.side == "left")!
      const {hcenter: sx, vcenter: sy} = left_axis.bbox

      tool_view._pan_start({type: "pan_start", sx, sy, dx: 0, dy: 0, modifiers, native: native_ev})
      tool_view._update(0, 50)
      tool_view._pan_end({type: "pan_end", sx, sy, dx: 0, dy: 50, modifiers, native: native_ev})

      const {x, y, y2} = get_ranges(plot_view)
      expect(x).to.be.equal([0, 1])      // x unchanged
      expect(y).to.not.be.equal([0, 1])  // main y moved
      expect(y2).to.be.equal([0, 10])    // extra y2 NOT moved ("none")
    })

    it("'cross' panning on y-axis moves the clicked y-range and its cross x-range", async () => {
      const tool = new PanTool({dimensions: "both", pan_together: "cross"})
      const plot_view = await mkplot_with_extra_y(tool)
      const tool_view = plot_view.owner.get_one(tool)

      const left_axis = plot_view.axis_views.find((v) => v.panel.side == "left")!
      const {hcenter: sx, vcenter: sy} = left_axis.bbox

      // Pan in both directions to make x movement observable
      tool_view._pan_start({type: "pan_start", sx, sy, dx: 0, dy: 0, modifiers, native: native_ev})
      tool_view._update(50, 50)
      tool_view._pan_end({type: "pan_end", sx, sy, dx: 50, dy: 50, modifiers, native: native_ev})

      const {x, y, y2} = get_ranges(plot_view)
      expect(x).to.not.be.equal([0, 1])  // x moved (cross of y-axis)
      expect(y).to.not.be.equal([0, 1])  // main y moved
      expect(y2).to.be.equal([0, 10])    // extra y2 NOT moved (only the cross pair)
    })

    it("panning inside the frame always moves all ranges regardless of pan_together", async () => {
      for (const pan_together of ["all", "none", "cross"] as const) {
        const tool = new PanTool({dimensions: "both", pan_together})
        const plot_view = await mkplot_with_extra_y(tool)
        const tool_view = plot_view.owner.get_one(tool)

        // sx/sy inside the frame
        const {hcenter: sx, vcenter: sy} = plot_view.frame.bbox

        tool_view._pan_start({type: "pan_start", sx, sy, dx: 0, dy: 0, modifiers, native: native_ev})
        tool_view._update(50, 50)
        tool_view._pan_end({type: "pan_end", sx, sy, dx: 50, dy: 50, modifiers, native: native_ev})

        const {x, y, y2} = get_ranges(plot_view)
        expect(x).to.not.be.equal([0, 1])
        expect(y).to.not.be.equal([0, 1])
        expect(y2).to.not.be.equal([0, 10])
      }
    })
  })

  describe("should support cursor", () => {
    it("width dimensions='both'", async () => {
      const tool = new PanTool({dimensions: "both"})
      const plot_view = await mkplot(tool)

      await expect_cursor(plot_view, xy(200, 200), xy(220, 220), "move")
      await expect_cursor(plot_view, xy(200, 10), xy(220, 10), "ew-resize")
      await expect_cursor(plot_view, xy(0, 200), xy(0, 220), "ns-resize")
    })

    it("width dimensions='width'", async () => {
      const tool = new PanTool({dimensions: "width"})
      const plot_view = await mkplot(tool)

      await expect_cursor(plot_view, xy(200, 200), xy(220, 220), "ew-resize")
      await expect_cursor(plot_view, xy(200, 10), xy(220, 10), "ew-resize")
      await expect_cursor(plot_view, xy(0, 200), xy(0, 220), "default")
    })

    it("width dimensions='height'", async () => {
      const tool = new PanTool({dimensions: "height"})
      const plot_view = await mkplot(tool)

      await expect_cursor(plot_view, xy(200, 200), xy(220, 220), "ns-resize")
      await expect_cursor(plot_view, xy(200, 10), xy(220, 10), "default")
      await expect_cursor(plot_view, xy(0, 200), xy(0, 220), "ns-resize")
    })
  })
})
