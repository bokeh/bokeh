import {expect} from "#framework/assertions"
import {create_glyph_view} from "./_util"
import {Bezier} from "@bokehjs/models/glyphs/bezier"
import {NormalHead} from "@bokehjs/models/annotations/arrow_head"
import {Decoration} from "@bokehjs/models/graphics/decoration"

describe("Bezier decorations", () => {
  for (const node of ["start", "end"] as const) {
    it(`should hit a head outside the curve bounds but not the hidden endpoint at ${node}`, async () => {
      const glyph = Bezier.create({decorations: [
        Decoration.create({node, inset: 20, marking: NormalHead.create({size: 12})}),
      ]})
      const view = await create_glyph_view(glyph, {
        x0: [0], y0: [50], cx0: [30], cy0: [50], cx1: [70], cy1: [50], x1: [100], y1: [50],
      })
      const sx = node == "end" ? view.sx1[0] : view.sx0[0], sy = view.sy1[0]
      const sign = node == "end" ? -1 : 1
      expect(view.hit_test({type: "point", sx: sx + sign*2, sy})?.indices).to.be.equal([])
      expect(view.hit_test({type: "point", sx: sx + sign*30, sy: sy + 4})?.indices).to.be.equal([0])
      expect(view.hit_test({type: "point", sx: sx + sign*45, sy})?.indices).to.be.equal([0])
      expect(view.hit_test({type: "span", direction: "h", sx: sx + sign*2, sy})?.indices).to.be.equal([])
      expect(view.hit_test({type: "span", direction: "h", sx: sx + sign*45, sy})?.indices).to.be.equal([0])
      expect(view.hit_test({type: "rect", sx0: sx + sign*3, sx1: sx + sign*1, sy0: sy - 2, sy1: sy + 2})?.indices).to.be.equal([])
      expect(view.hit_test({type: "rect", sx0: sx + sign*32, sx1: sx + sign*28, sy0: sy + 3, sy1: sy + 5})?.indices).to.be.equal([0])
    })
  }
})
