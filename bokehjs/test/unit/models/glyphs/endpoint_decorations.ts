import * as sinon from "sinon"
import {restorable} from "#framework/util"
import {expect} from "#framework/assertions"
import {create_glyph_view} from "./_util"
import {Segment} from "@bokehjs/models/glyphs/segment"
import {MultiLine} from "@bokehjs/models/glyphs/multi_line"
import {Line} from "@bokehjs/models/glyphs/line"
import {Bezier} from "@bokehjs/models/glyphs/bezier"
import {NormalHead} from "@bokehjs/models/annotations/arrow_head"
import {Decoration} from "@bokehjs/models/graphics/decoration"

// Exercise each glyph's paint entry point, rather than only the shared path helpers.
describe("Endpoint decorations", () => {
  for (const [name, create] of [
    ["Segment", (decoration: Decoration) => Segment.create({decorations: [decoration]})],
    ["MultiLine", (decoration: Decoration) => MultiLine.create({decorations: [decoration]})],
    ["Line", (decoration: Decoration) => Line.create({decorations: [decoration]})],
    ["Bezier", (decoration: Decoration) => Bezier.create({decorations: [decoration]})],
  ] as const) {
    for (const node of ["start", "end"] as const) {
      it(`should position and trim ${node} decorations on ${name}`, async () => {
        const marking = NormalHead.create({size: {field: "head_size"}})
        const decoration = Decoration.create({node, marking, inset: {field: "inset"}})
        const glyph = create(decoration)
        const coordinates = glyph instanceof Line ? {
          x: [0, 40, 100], y: [0, 30, 30],
        } : glyph instanceof MultiLine ? {
          xs: [[0, 40, 100], [0, 40, 100]], ys: [[0, 30, 30], [0, 30, 30]],
        } : {
          x0: [0, 0], y0: [0, 0], x1: [80, 80], y1: [60, 60],
          cx0: [20, 20], cy0: [15, 15], cx1: [60, 60], cy1: [45, 45],
        }
        const view = await create_glyph_view(glyph, {
          ...coordinates,
          inset: glyph instanceof Line ? [10, 20, 30] : [10, 20],
          head_size: glyph instanceof Line ? [12, 18, 24] : [12, 18],
        } as any)
        const [decoration_view] = view.decorations.values()
        const ctx = view.canvas.create_layer().ctx
        using paint = restorable(sinon.stub(decoration_view.marking, "paint"))
        using translate = restorable(sinon.spy(ctx, "translate"))
        using rotate = restorable(sinon.spy(ctx, "rotate"))
        using move = restorable(sinon.spy(ctx, "moveTo"))
        using line = restorable(sinon.spy(ctx, "lineTo"))
        const polyline = glyph instanceof Line || glyph instanceof MultiLine
        const sx = new Float64Array([0, 40, 100])
        const sy = new Float64Array([0, 30, 30])
        const data = glyph instanceof Line ? {sx, sy} : glyph instanceof MultiLine ? {
          sxs: {get: () => sx}, sys: {get: () => sy},
        } : {
          sx0: [0, 0], sy0: [0, 0], sx1: [80, 80], sy1: [60, 60],
          scx0: [20, 20], scy0: [15, 15], scx1: [60, 60], scy1: [45, 45],
        }
        // Line uses the first source row for its single path. The other glyphs
        // must resolve different sizes and insets for each path row.
        for (const i of glyph instanceof Line ? [0] : [0, 1]) {
          translate.resetHistory()
          rotate.resetHistory()
          paint.resetHistory()
          move.resetHistory()
          line.resetHistory()
          ;(view as any)._paint(ctx, glyph instanceof Line ? [0, 1, 2] : [i], data)
          const inset = [10, 20][i]
          const rear = inset + [12, 18][i]
          const ux = polyline && node == "end" ? 1 : 0.8
          const uy = polyline && node == "end" ? 0 : 0.6
          const endpoint = node == "start" ? [0, 0] : polyline ? [100, 30] : [80, 60]
          const sign = node == "start" ? 1 : -1
          sinon.assert.calledOnceWithExactly(translate, endpoint[0] + sign*inset*ux, endpoint[1] + sign*inset*uy)
          const angle = Math.atan2(uy, ux) + Math.PI/2 + (node == "start" ? Math.PI : 0)
          sinon.assert.calledOnceWithExactly(rotate, angle)
          sinon.assert.calledOnceWithExactly(paint, ctx, i)
          const shaft_endpoint = node == "start" ? move.firstCall.args : line.lastCall.args
          expect(Math.abs(shaft_endpoint[0] - (endpoint[0] + sign*rear*ux)) < 1e-9).to.be.true
          expect(Math.abs(shaft_endpoint[1] - (endpoint[1] + sign*rear*uy)) < 1e-9).to.be.true
        }
      })
    }
  }

  for (const node of ["start", "end"] as const) {
    it(`should orient a Bezier ${node} head along the curve rather than the endpoint chord`, async () => {
      const glyph = Bezier.create({decorations: [
        Decoration.create({node, marking: NormalHead.create({size: 12})}),
      ]})
      const view = await create_glyph_view(glyph, {
        x0: [0], y0: [0], cx0: [60], cy0: [0], cx1: [100], cy1: [40], x1: [100], y1: [100],
      })
      const [decoration] = view.decorations.values()
      const ctx = view.canvas.create_layer().ctx
      using paint = restorable(sinon.stub(decoration.marking, "paint"))
      using translate = restorable(sinon.spy(ctx, "translate"))
      using rotate = restorable(sinon.spy(ctx, "rotate"))
      ;(view as any)._paint(ctx, [0], {
        sx0: [0], sy0: [0], scx0: [60], scy0: [0], scx1: [100], scy1: [40], sx1: [100], sy1: [100],
      })
      sinon.assert.calledOnceWithExactly(translate, node == "start" ? 0 : 100, node == "start" ? 0 : 100)
      sinon.assert.calledOnce(paint)
      sinon.assert.calledOnce(rotate)
      // Adaptive subdivision approximates the analytic horizontal start and
      // vertical end tangents to within three degrees for this curve.
      // The endpoint chord would be diagonal (45 degrees away).
      const expected_angle = node == "start" ? 3*Math.PI/2 : Math.PI
      expect(Math.abs(rotate.firstCall.args[0] - expected_angle) < Math.PI/60).to.be.true
    })
  }
})
