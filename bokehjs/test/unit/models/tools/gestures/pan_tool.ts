import * as sinon from "sinon"

import {expect} from "#framework/assertions"
import type {XY} from "#framework/interactive"
import {actions, xy} from "#framework/interactive"
import {display} from "#framework/layouts"
import {restorable} from "#framework/util"

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

  async function expect_cursor(plot_view: PlotView, xy0: XY, xy1: XY, cursor: string): Promise<void> {
    const ac = actions(plot_view, {units: "screen"})
    const {ui_event_bus} = plot_view.canvas_view

    using spy_cursor = restorable(sinon.spy(ui_event_bus, "set_cursor"))

    await ac.pan(xy0, xy1, 5)

    const cursors = spy_cursor.args.map(([cursor]) => cursor ?? "default")
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
