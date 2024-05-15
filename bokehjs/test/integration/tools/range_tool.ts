import {display, fig} from "../_util"
import {PlotActions, xy} from "../../interactive"

import {PanTool, RangeTool, Range1d} from "@bokehjs/models"

describe("RangeTool", () => {
  it("should support select_gesture='none'", async () => {
    const x_range = new Range1d({start: 4, end: 8})

    const pan_tool = new PanTool()
    const range_tool = new RangeTool({x_range, select_gesture: "none"})

    const p = fig([400, 200], {
      x_range: [0, 10],
      y_range: [0, 2],
      tools: [pan_tool, range_tool],
    })

    const {view} = await display(p)
    const actions = new PlotActions(view)
    await actions.pan(xy(2, 1), xy(4, 1), 2)
    await view.ready
  })

  it("should support select_gesture='pan'", async () => {
    const x_range = new Range1d({start: 4, end: 8})

    const pan_tool = new PanTool()
    const range_tool = new RangeTool({x_range, select_gesture: "pan"})

    const p = fig([400, 200], {
      x_range: [0, 10],
      y_range: [0, 2],
      tools: [pan_tool, range_tool],
      active_drag: range_tool,
    })

    const {view} = await display(p)
    const actions = new PlotActions(view)
    await actions.pan(xy(2, 1), xy(4, 1), 2)
    await view.ready
  })

  it("should support select_gesture='tap'", async () => {
    const x_range = new Range1d({start: 4, end: 8})

    const pan_tool = new PanTool()
    const range_tool = new RangeTool({x_range, select_gesture: "tap"})

    const p = fig([400, 200], {
      x_range: [0, 10],
      y_range: [0, 2],
      tools: [pan_tool, range_tool],
    })

    const {view} = await display(p)
    const actions = new PlotActions(view)
    await actions.tap(xy(2, 1))
    await actions.hover(xy(2, 1), xy(4, 1), 2)
    await actions.tap(xy(4, 1))
    await actions.hover(xy(4, 1), xy(6, 1), 2)
    await view.ready
  })
})
