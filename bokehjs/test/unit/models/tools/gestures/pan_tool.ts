import {expect} from "assertions"
import type {XY} from "../../../../interactive"
import {actions, xy} from "../../../../interactive"
import {display} from "../../../_util"

import type {Tool} from "@bokehjs/models/tools/tool"
import {PanTool} from "@bokehjs/models/tools/gestures/pan_tool"
import type {PlotView} from "@bokehjs/models/plots/plot"
import {Plot, Range1d, LinearAxis} from "@bokehjs/models"
import {no_repeated} from "@bokehjs/core/util/iterator"

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
