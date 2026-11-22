import * as sinon from "sinon"
import {restorable} from "#framework/util"
import {expect} from "#framework/assertions"
import {create_glyph_renderer_view, create_glyph_view} from "./_util"
import {Segment} from "@bokehjs/models/glyphs/segment"
import {MultiLine} from "@bokehjs/models/glyphs/multi_line"
import {Line} from "@bokehjs/models/glyphs/line"
import {Bezier} from "@bokehjs/models/glyphs/bezier"
import {NormalHead} from "@bokehjs/models/annotations/arrow_head"
import {PathPlacement} from "@bokehjs/models/graphics/path_placement"

// Exercise each glyph's paint entry point, rather than only the shared path helpers.
describe("Endpoint markings", () => {
  for (const at of ["end", 1] as const) {
    const placement = at === "end" ? "the named end" : "fraction 1"
    it(`should paint add_arrowheads() at ${placement} on a bent path`, async () => {
      const sx = new Float64Array([0, 90, 100])
      const sy = new Float64Array([0, 0, 10])
      const {glyph: view, model: renderer, plot_view: plot} = await create_glyph_renderer_view(MultiLine.create(), {xs: [sx], ys: [sy]})
      const model = renderer.add_arrowheads({at, head: NormalHead.create({size: 30})})
      await plot.ready
      const path_marking = view.path_markings.get(model)!
      const ctx = view.canvas.create_layer().ctx
      using paint = restorable(sinon.stub(path_marking.marking, "paint"))
      using translate = restorable(sinon.spy(ctx, "translate"))
      using rotate = restorable(sinon.spy(ctx, "rotate"))
      using line = restorable(sinon.spy(ctx, "lineTo"))
      ;(view as any)._paint(ctx, [0], {sxs: {get: () => sx}, sys: {get: () => sy}})
      sinon.assert.calledOnce(paint)
      sinon.assert.calledOnceWithExactly(translate, 100, 10)
      const path_angle = at === "end" ? Math.PI/4 : Math.atan2(10, 40 - Math.hypot(10, 10))
      expect(Math.abs(rotate.firstCall.args[0] - (path_angle + Math.PI/2)) < 1e-9).to.be.true
      if (at === "end") {
        expect(line.getCalls().some(call => call.calledWithExactly(100, 10))).to.be.false
      } else {
        expect(line.lastCall.args).to.be.equal([100, 10])
      }
    })
  }

  for (const [name, create] of [
    ["Segment", (path_marking: PathPlacement) => Segment.create({path_markings: [path_marking]})],
    ["MultiLine", (path_marking: PathPlacement) => MultiLine.create({path_markings: [path_marking]})],
    ["Line", (path_marking: PathPlacement) => Line.create({path_markings: [path_marking]})],
    ["Bezier", (path_marking: PathPlacement) => Bezier.create({path_markings: [path_marking]})],
  ] as const) {
    for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
      it(`should place fraction ${fraction} on ${name} without trimming the shaft`, async () => {
        const path_marking = PathPlacement.create({positions: [fraction], marking: NormalHead.create({size: 12})})
        const glyph = create(path_marking)
        const coordinates = glyph instanceof Line ? {x: [0, 100], y: [0, 0]}
          : glyph instanceof MultiLine ? {xs: [[0, 100]], ys: [[0, 0]]}
          : {x0: [0], y0: [0], x1: [100], y1: [0], cx0: [25], cy0: [0], cx1: [75], cy1: [0]}
        const view = await create_glyph_view(glyph, coordinates as any)
        const ctx = view.canvas.create_layer().ctx
        using translate = restorable(sinon.spy(ctx, "translate"))
        using rotate = restorable(sinon.spy(ctx, "rotate"))
        using move = restorable(sinon.spy(ctx, "moveTo"))
        using line = restorable(sinon.spy(ctx, "lineTo"))
        const sx = new Float64Array([0, 100]), sy = new Float64Array([0, 0])
        const data = glyph instanceof Line ? {sx, sy}
          : glyph instanceof MultiLine ? {sxs: {get: () => sx}, sys: {get: () => sy}}
          : {sx0: [0], sy0: [0], sx1: [100], sy1: [0], scx0: [25], scy0: [0], scx1: [75], scy1: [0]}
        ;(view as any)._paint(ctx, glyph instanceof Line ? [0, 1] : [0], data)
        sinon.assert.calledWithExactly(translate, 100*fraction, 0)
        sinon.assert.calledWithExactly(rotate, Math.PI/2)
        expect(move.firstCall.args).to.be.equal([0, 0])
        expect(line.firstCall.args).to.be.equal([100, 0])
      })
    }
    for (const placement of ["start", "end"] as const) {
      it(`should position and trim ${placement} path_markings on ${name}`, async () => {
        const marking = NormalHead.create({size: {field: "head_size"}})
        const path_marking = PathPlacement.create({positions: placement, marking, inset: {field: "inset"}})
        const glyph = create(path_marking)
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
        const [decoration_view] = view.path_markings.values()
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
          const ux = polyline && placement == "end" ? 1 : 0.8
          const uy = polyline && placement == "end" ? 0 : 0.6
          const endpoint = placement == "start" ? [0, 0] : polyline ? [100, 30] : [80, 60]
          const sign = placement == "start" ? 1 : -1
          sinon.assert.calledOnceWithExactly(translate, endpoint[0] + sign*inset*ux, endpoint[1] + sign*inset*uy)
          const angle = Math.atan2(uy, ux) + Math.PI/2 + (placement == "start" ? Math.PI : 0)
          sinon.assert.calledOnceWithExactly(rotate, angle)
          sinon.assert.calledOnceWithExactly(paint, ctx, i)
          const shaft_endpoint = placement == "start" ? move.firstCall.args : line.lastCall.args
          expect(Math.abs(shaft_endpoint[0] - (endpoint[0] + sign*rear*ux)) < 1e-9).to.be.true
          expect(Math.abs(shaft_endpoint[1] - (endpoint[1] + sign*rear*uy)) < 1e-9).to.be.true
        }
      })
    }
  }

  for (const placement of ["start", "end"] as const) {
    it(`should orient a Bezier ${placement} head along the curve rather than the endpoint chord`, async () => {
      const glyph = Bezier.create({path_markings: [
        PathPlacement.create({positions: placement, marking: NormalHead.create({size: 12})}),
      ]})
      const view = await create_glyph_view(glyph, {
        x0: [0], y0: [0], cx0: [60], cy0: [0], cx1: [100], cy1: [40], x1: [100], y1: [100],
      })
      const [path_marking] = view.path_markings.values()
      const ctx = view.canvas.create_layer().ctx
      using paint = restorable(sinon.stub(path_marking.marking, "paint"))
      using translate = restorable(sinon.spy(ctx, "translate"))
      using rotate = restorable(sinon.spy(ctx, "rotate"))
      ;(view as any)._paint(ctx, [0], {
        sx0: [0], sy0: [0], scx0: [60], scy0: [0], scx1: [100], scy1: [40], sx1: [100], sy1: [100],
      })
      sinon.assert.calledOnceWithExactly(translate, placement == "start" ? 0 : 100, placement == "start" ? 0 : 100)
      sinon.assert.calledOnce(paint)
      sinon.assert.calledOnce(rotate)
      // Adaptive subdivision approximates the analytic horizontal start and
      // vertical end tangents to within three degrees for this curve.
      // The endpoint chord would be diagonal (45 degrees away).
      const expected_angle = placement == "start" ? 3*Math.PI/2 : Math.PI
      expect(Math.abs(rotate.firstCall.args[0] - expected_angle) < Math.PI/60).to.be.true
    })
  }
})
