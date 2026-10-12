import * as sinon from "sinon"
import {restorable} from "#framework/util"
import {expect} from "#framework/assertions"

import {create_glyph_view} from "./_util"
import {NormalHead, OpenHead, VeeHead} from "@bokehjs/models/annotations/arrow_head"
import {Segment} from "@bokehjs/models/glyphs/segment"
import {Decoration} from "@bokehjs/models/graphics/decoration"

describe("Segment", () => {
  for (const [Head, distance] of [[OpenHead, 15], [VeeHead, 28]] as const) {
    for (const node of ["start", "end"] as const) {
      it(`should keep the shaft connected to ${Head.name} at the ${node}`, async () => {
        const glyph = Segment.create({decorations: [
          Decoration.create({node, marking: Head.create({size: 40})}),
        ]})
        const view = await create_glyph_view(glyph, {x0: [0], y0: [50], x1: [100], y1: [50]})
        const sx = node == "end" ? view.sx1[0] - distance : view.sx0[0] + distance
        expect(view.hit_test({type: "point", sx, sy: view.sy0[0]})?.indices).to.be.equal([0])
      })
    }
  }

  for (const node of ["start", "end"] as const) {
    it(`should hit a decorated segment only where its shaft or marking is visible at ${node}`, async () => {
      const marking = NormalHead.create({size: 12})
      const decoration = Decoration.create({marking, node, inset: 20})
      const glyph = Segment.create({
        x0: {field: "x0"},
        y0: {field: "y0"},
        x1: {field: "x1"},
        y1: {field: "y1"},
        decorations: [decoration],
      })
      const glyph_view = await create_glyph_view(glyph, {
        x0: [0], y0: [50], x1: [100], y1: [50],
      })

      const sx0 = glyph_view.sx0[0]
      const sy0 = glyph_view.sy0[0]
      const sx1 = glyph_view.sx1[0]
      const sy1 = glyph_view.sy1[0]
      const length = Math.hypot(sx1 - sx0, sy1 - sy0)
      const ux = (sx1 - sx0)/length
      const uy = (sy1 - sy0)/length
      const from_end = (distance: number) => node == "end"
        ? {sx: sx1 - distance*ux, sy: sy1 - distance*uy}
        : {sx: sx0 + distance*ux, sy: sy0 + distance*uy}

      expect(glyph_view.hit_test({type: "point", ...from_end(2)})?.indices).to.be.equal([])
      expect(glyph_view.hit_test({type: "point", ...from_end(26)})?.indices).to.be.equal([0])
      // The arrowhead extends beyond the shaft's data-space bounding box.
      const wing = from_end(30)
      expect(glyph_view.hit_test({type: "point", sx: wing.sx - 4*uy, sy: wing.sy + 4*ux})?.indices).to.be.equal([0])
      expect(glyph_view.hit_test({type: "point", ...from_end(45)})?.indices).to.be.equal([0])
    })
  }

  for (const node of ["start", "end"] as const) {
    for (const [inset, x1] of [[-20, 150], [250, 150], [20, 50]]) {
      it(`should preserve ${node} painting and hits for inset=${inset}, x1=${x1}`, async () => {
        const glyph = Segment.create({decorations: [
          Decoration.create({node, inset, marking: NormalHead.create({size: 12})}),
        ]})
        const view = await create_glyph_view(glyph, {x0: [50], y0: [50], x1: [x1], y1: [50]})
        const [decoration] = view.decorations.values()
        const ctx = view.canvas.create_layer().ctx
        using paint = restorable(sinon.stub(decoration.marking, "paint"))
        using translate = restorable(sinon.spy(ctx, "translate"))
        const sign = node == "start" ? 1 : -1
        const sy = view.sy0[0]
        const tip = (node == "start" ? view.sx0[0] : view.sx1[0]) + (x1 == 50 ? 0 : sign*inset)
        ;(view as any)._paint(ctx, [0])
        sinon.assert.calledOnceWithExactly(translate, tip, sy)
        sinon.assert.calledOnce(paint)
        expect(view.hit_test({type: "point", sx: tip + sign*6, sy})?.indices).to.be.equal([0])
      })
    }
  }

})
