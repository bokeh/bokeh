import {display, fig, row} from "../_util"
import {PlotActions, xy} from "../../interactive"

import type {Plot} from "@bokehjs/models"
import {Range1d, FactorRange, WheelZoomTool, LinearScale, CategoricalScale} from "@bokehjs/models"
import {DataRenderer} from "@bokehjs/models/renderers/data_renderer"
import {enumerate} from "@bokehjs/core/util/iterator"

describe("WheelZoomTool", () => {
  it("should support zooming sub-coordinates", async () => {
    function plot(title: string) {
      const x_range = new Range1d({start: 0, end: 10})
      const y_range = new FactorRange({factors: ["A", "B", "C"]})

      const p = fig([300, 300], {x_range, y_range, title, tools: ["hover"]})

      for (const [color, i] of enumerate(["red", "green", "blue"])) {
        const xy = p.subplot({
          x_source: p.x_range,
          y_source: new FactorRange({factors: ["u", "v", "w"]}),
          x_target: p.x_range,
          y_target: new Range1d({start: i, end: i + 1}),
          x_scale: new LinearScale(),
          y_scale: new CategoricalScale(),
        })

        xy.scatter({
          x: [1, 2, 3, 4, 5, 6, 7, 8, 9],
          y: ["u", "v", "w", "u", "v", "w", "u", "v", "w"],
          size: 10,
          color,
        })
      }

      return p
    }

    const p0 = plot("Before zoom")
    const p1 = plot("Sub-coordinate zoom level 0")
    const p2 = plot("Sub-coordinate zoom level 1")

    function data_renderers(p: Plot): DataRenderer[] {
      return p.renderers.filter((r): r is DataRenderer => r instanceof DataRenderer)
    }

    const wheel_zoom1 = new WheelZoomTool({renderers: data_renderers(p1), level: 0})
    p1.add_tools(wheel_zoom1)
    p1.toolbar.active_scroll = wheel_zoom1

    const wheel_zoom2 = new WheelZoomTool({renderers: data_renderers(p2), level: 1})
    p2.add_tools(wheel_zoom2)
    p2.toolbar.active_scroll = wheel_zoom2

    const {view} = await display(row([p0, p1, p2]))

    const delta = 5*120

    const pv1 = view.owner.get_one(p1)
    const actions1 = new PlotActions(pv1)
    await actions1.scroll(xy(5, 1.5 /*B*/), delta)
    await pv1.ready

    const pv2 = view.owner.get_one(p2)
    const actions2 = new PlotActions(pv2)
    await actions2.scroll(xy(5, 1.5 /*B*/), delta)
    await pv2.ready
  })

  it("should notify when modifiers aren't satisfied", async () => {
    const wheel_zoom = new WheelZoomTool({modifiers: {ctrl: true}})
    const p = fig([200, 200], {tools: [wheel_zoom]})
    p.scatter({x: [1, 2, 3], y: [1, 2, 3], size: 20})
    const {view} = await display(p)

    const actions1 = new PlotActions(view)
    await actions1.scroll(xy(2, 2), 120)
    await view.ready
  })
})
