import * as sinon from "sinon"
import {restorable} from "#framework/util"
import {expect} from "#framework/assertions"
import {create_glyph_view} from "./_util"
import {Line} from "@bokehjs/models/glyphs/line"
import {NormalHead} from "@bokehjs/models/annotations/arrow_head"
import {PathDecoration, PathMarkings} from "@bokehjs/models/graphics/decoration"

describe("Line decorations", () => {
  for (const placement of ["middle", 0.5] as const) {
    for (const [x, endpoints] of [
      [[0, 90, 95, 100], [0, 1]],
      [[0, 5, 10, 100], [2, 3]],
      [[0, 90, NaN, 95, 100], [0, 1]],
    ]) {
      it(`should select the ${placement} head with its actual path segment for x=${x}`, async () => {
        const glyph = Line.create({decorations: [
          typeof placement == "number"
            ? PathMarkings.create({positions: [placement], marking: NormalHead.create({size: 12})})
            : PathDecoration.create({node: placement, marking: NormalHead.create({size: 12})}),
        ]})
        const view = await create_glyph_view(glyph, {x, y: x.map(value => isFinite(value) ? 50 : NaN)})
        const {renderer} = view
        const selected_marking = [...renderer.selection_glyph.decorations.values()][0].marking
        const nonselected_marking = [...renderer.nonselection_glyph.decorations.values()][0].marking
        using selected_paint = restorable(sinon.spy(selected_marking, "paint"))
        using nonselected_paint = restorable(sinon.spy(nonselected_marking, "paint"))
        const ctx = view.canvas.create_layer().ctx
        for (const selection of [endpoints, [endpoints[0]]]) {
          renderer.model.data_source.selected.indices = selection
          await renderer.ready
          selected_paint.resetHistory()
          nonselected_paint.resetHistory()
          renderer.paint(ctx)
          if (selection.length == 2) {
            sinon.assert.calledOnce(selected_paint)
            sinon.assert.notCalled(nonselected_paint)
          } else {
            sinon.assert.notCalled(selected_paint)
            sinon.assert.calledOnce(nonselected_paint)
          }
        }
      })
    }
  }

  for (const placement of ["start", "end"] as const) {
    it(`should hit visible heads and trimmed shafts without losing Line selection indices at ${placement}`, async () => {
      const glyph = Line.create({x: {field: "x"}, y: {field: "y"}, decorations: [
        PathDecoration.create({node: placement, inset: 20, marking: NormalHead.create({size: 12})}),
      ]})
      const view = await create_glyph_view(glyph, {x: [0, 50, 100], y: [50, 50, 50]})
      const sx = placement == "end" ? view.sx[2] : view.sx[0], sy = view.sy[2]
      const sign = placement == "end" ? -1 : 1
      const segment = placement == "end" ? 1 : 0
      expect(view.hit_test({type: "point", sx: sx + sign*2, sy})?.line_indices).to.be.equal(new Int32Array([]))
      expect(view.hit_test({type: "span", direction: "h", sx: sx + sign*2, sy})?.line_indices).to.be.equal(new Int32Array([]))
      expect(view.hit_test({type: "span", direction: "h", sx: sx + sign*45, sy})?.line_indices).to.be.equal(new Int32Array([segment]))
      const head = view.hit_test({type: "point", sx: sx + sign*26, sy})!
      expect(head.line_indices).to.be.equal(new Int32Array([segment]))
      expect(head.selected_glyphs.includes(glyph)).to.be.true
      expect(view.hit_test({type: "point", sx: sx + sign*45, sy})?.line_indices).to.be.equal(new Int32Array([segment]))
      expect((view as any)._compute_can_use_webgl()).to.be.false
    })
  }
})
