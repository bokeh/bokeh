import {display, fig, row} from "../_util"

import {EqHistColorMapper, HoverTool, WeightedStackColorMapper} from "@bokehjs/models"
import type {Renderer} from "@bokehjs/models"
import {varying_alpha_palette} from "@bokehjs/api/palettes"
import {Float64NDArray} from "@bokehjs/core/util/ndarray"
import type {PlotView} from "@bokehjs/models/plots/plot"
import {offset_bbox} from "@bokehjs/core/dom"

describe("ImageStack glyph", () => {
  it("should support hover tooltip", async () => {
    // Synthetic data of shape (3, 3, 2), i.e. a stack of two 2D arrays of shape (3, 3) each.
    const data = [NaN, NaN, 1, 0, 4, 0, 0, 1, 1, 1, 4, 1, 0, 4, 1, 4, 4, 4]
    const array = new Float64NDArray(data, [3, 3, 2])

    function plot() {
      const p = fig([200, 200])
      const alpha_palette = varying_alpha_palette("#000", 6, 40)
      const alpha_mapper = new EqHistColorMapper({palette: alpha_palette, rescale_discrete_levels: false})
      const color_mapper = new WeightedStackColorMapper({palette: ["red", "blue"], alpha_mapper})
      const ir = p.image_stack({image: [array], x: 0, y: 0, dw: 1, dh: 1, color_mapper})
      p.add_tools(new HoverTool({
        renderers: [ir],
        tooltips: [["value", "@image"]],
      }))
      return [p, ir] as const
    }

    const [p0, r0] = plot()
    const [p1, r1] = plot()
    const [p2, r2] = plot()

    const {view} = await display(row([p0, p1, p2]))

    function hover_at(plot_view: PlotView, r: Renderer, x: number, y: number) {
      const crv = plot_view.owner.get_one(r)
      const [[sx], [sy]] = crv.coordinates.map_to_screen([x], [y])

      const ui = plot_view.canvas_view.ui_event_bus
      const {left, top} = offset_bbox(ui.hit_area)

      const ev = new MouseEvent("mousemove", {clientX: left + sx, clientY: top + sy})
      ui.hit_area.dispatchEvent(ev)
    }

    const [pv0, pv1, pv2] = view.child_views as PlotView[]

    hover_at(pv0, r0, 0.2, 0.8)
    hover_at(pv1, r1, 0.8, 0.5)
    hover_at(pv2, r2, 0.2, 0.2)

    await view.ready
  })
})
