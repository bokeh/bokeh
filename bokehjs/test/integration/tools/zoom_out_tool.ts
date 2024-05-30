import {display, fig, row} from "../_util"

import type {Plot} from "@bokehjs/models"
import {Range1d, FactorRange, ZoomOutTool, LinearScale, CategoricalScale} from "@bokehjs/models"
import {DataRenderer} from "@bokehjs/models/renderers/data_renderer"
import {enumerate, range} from "@bokehjs/core/util/iterator"

describe("ZoomOutTool", () => {
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

    const zoom_in1 = new ZoomOutTool({renderers: data_renderers(p1), level: 0})
    p1.add_tools(zoom_in1)

    const zoom_in2 = new ZoomOutTool({renderers: data_renderers(p2), level: 1})
    p2.add_tools(zoom_in2)

    const {view} = await display(row([p0, p1, p2]))

    const n = 5

    const pv1 = view.owner.get_one(p1)
    const zv1 = pv1.owner.get_one(zoom_in1)
    for (const _ of range(n)) {
      zv1.doit()
    }
    await pv1.ready

    const pv2 = view.owner.get_one(p2)
    const zv2 = pv2.owner.get_one(zoom_in2)
    for (const _ of range(n)) {
      zv2.doit()
    }
    await pv2.ready
  })
})
