import {expect} from "assertions"
import {display, fig} from "./_util"

import {Rect, HoverTool} from "@bokehjs/models"

describe("Bug", () => {
  describe("in issue #10612", () => {
    it("prevents hovering over dynamically added glyphs", async () => {
      const hover = new HoverTool({renderers: "auto"})
      const plot = fig([200, 200], {tools: [hover]})
      plot.circle([1, 2, 3], [4, 5, 6])
      const {view} = await display(plot, [250, 250])
      const hover_view = view.tool_views.get(hover)! as HoverTool["__view_type__"]
      expect(hover_view.computed_renderers.length).to.be.equal(1)

      plot.circle([2, 3, 4], [4, 5, 6])
      plot.circle([3, 4, 5], [4, 5, 6])
      await view.ready
      expect(hover_view.computed_renderers.length).to.be.equal(3)
    })
  })

  describe("in issue #9752", () => {
    it("prevents from hit testing Rect glyph with angle != 0", async () => {
      const plot = fig([600, 600])
      const rect = plot.rect({
        x:      [-3, -2, -1, 0,  1,  2,  3,  -2,   2],
        y:      [-3, -2, -1, 0,  1,  2,  3,   2,  -2],
        width:  [ 3,  2,  1, 1,  1,  2,  3,   2,   3],
        height: [ 3,  2,  1, 1,  1,  2,  3,   2,   3],
        angle:  [45, 30, 15, 0, 15, 30, 45, 270, 450],
        fill_alpha: 0.5,
        // TODO: angle_units: "deg",
      })
      rect.glyph.angle.units = "deg"

      const {view} = await display(plot)
      const rect_view = view.renderer_view(rect)!.glyph as Rect["__view_type__"]

      function hit_test(x: number, y: number): number[] | undefined {
        const sx = view.frame.x_scale.compute(x)
        const sy = view.frame.y_scale.compute(y)
        return rect_view.hit_test({type: "point", sx, sy})?.indices
      }

      expect(hit_test(0, 0)).to.be.equal([3])
      expect(hit_test(2, -4)).to.be.equal([])
      // TODO: add more cases
    })
  })
})
