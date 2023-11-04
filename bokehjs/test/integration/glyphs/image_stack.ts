import {display, fig, row} from "../_util"
import {actions, xy} from "../../interactive"

import {EqHistColorMapper, HoverTool, WeightedStackColorMapper} from "@bokehjs/models"
import {varying_alpha_palette} from "@bokehjs/api/palettes"
import {Float64NDArray} from "@bokehjs/core/util/ndarray"

describe("ImageStack glyph", () => {
  it("should support hover tooltip", async () => {
    // Synthetic data of shape (3, 3, 2), i.e. a stack of two 2D arrays of shape (3, 3) each.
    const data = [NaN, NaN, 11, 10, 14, 10, 10, 11, 11, 11, 14, 11, 10, 14, 11, 14, 14, 14]
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
      return p
    }

    const p0 = plot()
    const p1 = plot()
    const p2 = plot()

    const {view} = await display(row([p0, p1, p2]))

    const pv0 = view.owner.get_one(p0)
    const pv1 = view.owner.get_one(p1)
    const pv2 = view.owner.get_one(p2)

    await actions(pv0).hover(xy(0.2, 0.8))
    await actions(pv1).hover(xy(0.8, 0.5))
    await actions(pv2).hover(xy(0.2, 0.2))

    await view.ready
  })
})
