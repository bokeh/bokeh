import * as sinon from "sinon"

import {expect} from "#framework/assertions"

import {create_glyph_view} from "./_util"
import {MultiLine} from "@bokehjs/models/glyphs/multi_line"
import {NormalHead} from "@bokehjs/models/annotations/arrow_head"
import {PathDecoration} from "@bokehjs/models/graphics/decoration"
import type {Context2d} from "@bokehjs/core/util/canvas"

describe("MultiLine", () => {
  it("should materialize nested ISO date coordinates without changing source data", async () => {
    const xs = [["2024-01-01", "2024-01-02"]]
    const expected_xs = xs.map((line) => [...line])
    const glyph = MultiLine.create({xs: {field: "xs"}, ys: {field: "ys"}})
    const glyph_view = await create_glyph_view(glyph, {xs: xs as any, ys: [[1, 2]]})

    expect([...glyph_view.xs.get(0)]).to.be.equal([Date.UTC(2024, 0, 1), Date.UTC(2024, 0, 2)])
    expect(glyph_view.renderer.model.data_source.get_array("xs")).to.be.equal(expected_xs)
  })

  it("should place vectorized end decorations on the final path tangent and stop the shaft at the rear of the marking", async () => {
    const marking = NormalHead.create({size: {field: "head_size"}})
    const decoration = PathDecoration.create({marking, node: "end", inset: {field: "inset"}})
    const glyph = MultiLine.create({
      xs: {field: "xs"},
      ys: {field: "ys"},
      decorations: [decoration],
    })
    const glyph_view = await create_glyph_view(glyph, {
      xs: [[0, 40, 100]],
      ys: [[0, 30, 30]],
      inset: [20],
      head_size: [12],
    } as any)
    expect((glyph_view as any)._compute_can_use_webgl()).to.be.false
    const [decoration_view] = glyph_view.decorations.values()
    const paint = sinon.stub(decoration_view.marking, "paint")
    const save = sinon.spy()
    const restore = sinon.spy()
    const translate = sinon.spy()
    const rotate = sinon.spy()
    const beginPath = sinon.spy()
    const moveTo = sinon.spy()
    const lineTo = sinon.spy()
    const stroke = sinon.spy()
    const ctx = {save, restore, translate, rotate, beginPath, moveTo, lineTo, stroke} as unknown as Context2d

    ;(glyph_view as any)._render_decorations(
      ctx,
      0,
      new Float64Array([0, 40, 100]),
      new Float64Array([0, 30, 30]),
    )

    sinon.assert.calledOnceWithExactly(translate, 80, 30)
    sinon.assert.calledOnceWithExactly(rotate, Math.PI/2)
    sinon.assert.calledOnceWithExactly(paint, ctx, 0)
    sinon.assert.calledOnce(save)
    sinon.assert.calledOnce(restore)

    const set_vectorize = sinon.stub(glyph_view.visuals.line, "set_vectorize")
    ;(glyph_view as any)._paint(ctx, [0], {
      sxs: {get: () => new Float64Array([0, 40, 100])},
      sys: {get: () => new Float64Array([0, 30, 30])},
    })
    sinon.assert.calledOnce(set_vectorize)
    sinon.assert.calledWithExactly(moveTo, 0, 0)
    sinon.assert.calledWithExactly(lineTo, 40, 30)
    sinon.assert.calledWithExactly(lineTo, 68, 30)
    expect(lineTo.calledWith(80, 30)).to.be.false
    expect(lineTo.calledWith(100, 30)).to.be.false

    decoration.inset = 10
    marking.size = 18
    await decoration_view.ready
    await decoration_view.marking.ready
    expect(decoration_view.inset.get(0)).to.be.equal(10)
    expect(decoration_view.marking.size.get(0)).to.be.equal(18)
  })

  for (const placement of ["start", "end"] as const) {
    it(`should hit a curved decorated path only where its shaft or marking is visible at ${placement}`, async () => {
      const marking = NormalHead.create({size: 12})
      const decoration = PathDecoration.create({marking, node: placement, inset: 20})
      const glyph = MultiLine.create({
        xs: {field: "xs"},
        ys: {field: "ys"},
        decorations: [decoration],
      })
      const glyph_view = await create_glyph_view(glyph, {
        xs: [[0, 50, 100]],
        ys: [[50, 75, 50]],
      })

      const sx = glyph_view.sxs.get(0)
      const sy = glyph_view.sys.get(0)
      const j = placement == "end" ? sx.length - 1 : 1
      const length = Math.hypot(sx[j] - sx[j - 1], sy[j] - sy[j - 1])
      const ux = (sx[j] - sx[j - 1])/length
      const uy = (sy[j] - sy[j - 1])/length
      const from_end = (distance: number) => placement == "end"
        ? {sx: sx[j] - distance*ux, sy: sy[j] - distance*uy}
        : {sx: sx[0] + distance*ux, sy: sy[0] + distance*uy}

      const hidden = from_end(2)
      const head = from_end(26)
      const shaft = from_end(45)

      expect(glyph_view.hit_test({type: "point", ...hidden})?.indices).to.be.equal(new Int32Array([]))
      expect(glyph_view.hit_test({type: "point", ...head})?.indices).to.be.equal(new Int32Array([0]))
      expect(glyph_view.hit_test({type: "point", ...shaft})?.indices).to.be.equal(new Int32Array([0]))

      expect(glyph_view.hit_test({type: "span", direction: "h", ...hidden})?.indices).to.be.equal(new Int32Array([]))
      expect(glyph_view.hit_test({type: "span", direction: "h", ...head})?.indices).to.be.equal(new Int32Array([0]))

      expect(glyph_view.hit_test({
        type: "rect",
        sx0: hidden.sx - 2,
        sx1: hidden.sx + 2,
        sy0: hidden.sy - 2,
        sy1: hidden.sy + 2,
      })?.indices).to.be.equal(new Int32Array([]))
      expect(glyph_view.hit_test({
        type: "rect",
        sx0: head.sx - 2,
        sx1: head.sx + 2,
        sy0: head.sy - 2,
        sy1: head.sy + 2,
      })?.indices).to.be.equal(new Int32Array([0]))
    })
  }
})
