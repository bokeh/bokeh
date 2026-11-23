import * as sinon from "sinon"

import {expect} from "#framework/assertions"
import type {XY} from "#framework/interactive"
import {actions, xy} from "#framework/interactive"
import {display} from "#framework/layouts"
import {restorable} from "#framework/util"

import type {Tool} from "@bokehjs/models/tools/tool"
import {PanTool} from "@bokehjs/models/tools/gestures/pan_tool"
import type {PlotView} from "@bokehjs/models/plots/plot"
import type {RangeManager} from "@bokehjs/models/plots/range_manager"
import {ColumnDataSource, DataRange1d, GlyphRenderer, LinearAxis, Plot, Range1d, Scatter} from "@bokehjs/models"
import {no_repeated} from "@bokehjs/core/util/iterator"
import {paint} from "@bokehjs/core/util/defer"
import type {KeyModifiers} from "@bokehjs/core/ui_gestures"

describe("PanTool", () => {

  async function mkplot(tool: Tool): Promise<PlotView> {
    const plot = Plot.create({
      width: 400,
      height: 400,
      min_border: 0,
      x_range: Range1d.create({start: 0, end: 1}),
      y_range: Range1d.create({start: 0, end: 1}),
    })
    plot.add_tools(tool)
    plot.add_layout(LinearAxis.create(), "above")
    plot.add_layout(LinearAxis.create(), "left")
    const {view} = await display(plot)
    return view
  }

  async function mkplot_with_extra_y(tool: Tool): Promise<PlotView> {
    const plot = Plot.create({
      width: 400,
      height: 400,
      min_border: 0,
      x_range: Range1d.create({start: 0, end: 1}),
      y_range: Range1d.create({start: 0, end: 1}),
    })
    plot.extra_y_ranges = {y2: Range1d.create({start: 0, end: 10})}
    plot.add_tools(tool)
    plot.add_layout(LinearAxis.create(), "left")
    plot.add_layout(LinearAxis.create({y_range_name: "y2"}), "right")
    const {view} = await display(plot)
    return view
  }

  async function mkplot_with_series(tool: Tool): Promise<{plot_view: PlotView, source: ColumnDataSource}> {
    // one measured quantity (y) sampled once per observation (x)
    const source = ColumnDataSource.create({data: {x: [0, 1, 2, 3], y: [5, 0, 10, 2]}})
    const glyph = Scatter.create({x: {field: "x"}, y: {field: "y"}})
    const renderer = GlyphRenderer.create({data_source: source, glyph})
    const plot = Plot.create({
      width: 400,
      height: 400,
      min_border: 0,
      renderers: [renderer],
      x_range: DataRange1d.create({range_padding: 0, range_padding_units: "absolute"}),
      y_range: DataRange1d.create({range_padding: 0, range_padding_units: "absolute"}),
    })
    plot.add_tools(tool)
    plot.add_layout(LinearAxis.create(), "left")
    const {view} = await display(plot)
    return {plot_view: view, source}
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

  async function expect_cursor(plot_view: PlotView, xy0: XY, xy1: XY, cursor: string): Promise<void> {
    const ac = actions(plot_view, {units: "screen"})
    const {ui_event_bus} = plot_view.canvas_view

    using spy_cursor = restorable(sinon.spy(ui_event_bus, "set_cursor"))

    await ac.pan(xy0, xy1, 5)

    const cursors = spy_cursor.args.map(([cursor]) => cursor ?? "default")
    expect([...no_repeated(cursors)]).to.be.equal([...no_repeated(["default", cursor, "default"])])
  }

  it("should not be cancelled with Escape", async () => {
    async function pan(escape: boolean): Promise<[number, number]> {
      const tool = PanTool.create({dimensions: "both"})
      const plot_view = await mkplot(tool)
      const ac = actions(plot_view, {units: "screen"})

      const events = [...ac._pan({type: "line", xy0: xy(200, 200), xy1: xy(260, 200)})]
      const pointerup = events.pop()!
      await ac.emit(events)
      if (escape) {
        const event = new KeyboardEvent("keydown", {key: "Escape", bubbles: true, cancelable: true})
        document.dispatchEvent(event)
        expect(event.defaultPrevented).to.be.false
      }
      await ac.emit([pointerup])

      const {start, end} = plot_view.model.x_range as Range1d
      return [start, end]
    }

    const expected = await pan(false)
    expect(expected).to.not.be.similar([0, 1])
    expect(await pan(true)).to.be.similar(expected)
  })

  describe("should support pan_together", () => {
    const modifiers: KeyModifiers = {alt: false, ctrl: false, shift: false}
    const native_ev = new PointerEvent("pointermove")

    it("'all' panning on y-axis moves all y-ranges but not x", async () => {
      const tool = PanTool.create({dimensions: "both", pan_together: "all"})
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
      const tool = PanTool.create({dimensions: "both", pan_together: "none"})
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
      const tool = PanTool.create({dimensions: "both", pan_together: "cross"})
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

    it("does not switch off auto-ranging of the cross range when the gesture never travels along it", async () => {
      const tool = PanTool.create({dimensions: "both", pan_together: "cross"})
      const {plot_view, source} = await mkplot_with_series(tool)
      const range_manager = (plot_view as any)._range_manager as RangeManager // XXX: protected

      const {x_range, y_range} = plot_view.frame
      expect(x_range.interval).to.be.equal([0, 3])   // the observations span x in [0, 3]
      expect(y_range.interval).to.be.equal([0, 10])  // and y in [0, 10]

      // a straight vertical drag along the y-axis: dy != 0, dx == 0 throughout
      const tool_view = plot_view.owner.get_one(tool)
      const left_axis = plot_view.axis_views.find((v) => v.panel.side == "left")!
      const {hcenter: sx, vcenter: sy} = left_axis.bbox

      tool_view._pan_start({type: "pan_start", sx, sy, dx: 0, dy: 0, modifiers, native: native_ev})
      tool_view._update(0, 50)
      tool_view._pan_end({type: "pan_end", sx, sy, dx: 0, dy: 50, modifiers, native: native_ev})

      const y_window: [number, number] = [y_range.start, y_range.end]
      expect(y_range.interval).to.not.be.equal([0, 10])  // the dragged range really did move

      source.stream({x: [7], y: [5]})  // a new observation beyond x = 3
      await paint()                          // the renderer takes the new data in asynchronously
      range_manager.update_dataranges()

      // nothing ever traveled along x, so it must still auto-range to the new data
      expect(x_range.interval).to.be.equal([0, 7])
      // y was panned on purpose, so it keeps the window the user dragged it to
      expect(y_range.interval).to.be.equal(y_window)
    })

    it("panning inside the frame always moves all ranges regardless of pan_together", async () => {
      for (const pan_together of ["all", "none", "cross"] as const) {
        const tool = PanTool.create({dimensions: "both", pan_together})
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
      const tool = PanTool.create({dimensions: "both"})
      const plot_view = await mkplot(tool)

      await expect_cursor(plot_view, xy(200, 200), xy(220, 220), "move")
      await expect_cursor(plot_view, xy(200, 10), xy(220, 10), "ew-resize")
      await expect_cursor(plot_view, xy(0, 200), xy(0, 220), "ns-resize")
    })

    it("width dimensions='width'", async () => {
      const tool = PanTool.create({dimensions: "width"})
      const plot_view = await mkplot(tool)

      await expect_cursor(plot_view, xy(200, 200), xy(220, 220), "ew-resize")
      await expect_cursor(plot_view, xy(200, 10), xy(220, 10), "ew-resize")
      await expect_cursor(plot_view, xy(0, 200), xy(0, 220), "default")
    })

    it("width dimensions='height'", async () => {
      const tool = PanTool.create({dimensions: "height"})
      const plot_view = await mkplot(tool)

      await expect_cursor(plot_view, xy(200, 200), xy(220, 220), "ns-resize")
      await expect_cursor(plot_view, xy(200, 10), xy(220, 10), "default")
      await expect_cursor(plot_view, xy(0, 200), xy(0, 220), "ns-resize")
    })
  })
})
