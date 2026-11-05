import * as sinon from "sinon"
import {restorable} from "#framework/util"
import {expect} from "#framework/assertions"
import {create_glyph_view} from "./_util"
import {Arc} from "@bokehjs/models/glyphs/arc"
import {PathDecoration, PathMarkings} from "@bokehjs/models/graphics/decoration"
import {NormalHead} from "@bokehjs/models/annotations/arrow_head"

const pi = Math.PI

describe("Arc decorations", () => {
  for (const [direction, start, end, sweep] of [
    ["clock", 0, pi/2, pi/2],
    ["anticlock", 0, -pi/2, -pi/2],
    ["clock", 3*pi/2, pi/2, pi],
    ["anticlock", pi/2, 3*pi/2, -pi],
    ["clock", 0, 5*pi/2, 2*pi],
    ["anticlock", 0, -5*pi/2, -2*pi],
    ["clock", 5*pi/2, 0, 3*pi/2],
    ["anticlock", -5*pi/2, 0, -3*pi/2],
  ] as const) {
    for (const placement of [0, 0.25, 0.5, 0.75, 1, "middle"] as const) {
      it(`should place ${placement} on ${direction} arc from ${start} to ${end}`, async () => {
        const decoration = typeof placement == "number"
          ? PathMarkings.create({positions: [placement], marking: NormalHead.create({size: 20})})
          : PathDecoration.create({node: placement, marking: NormalHead.create({size: 20}), inset: 999})
        const glyph = Arc.create({direction, decorations: [decoration]})
        const view = await create_glyph_view(glyph, {x: [0], y: [0], radius: [100], start_angle: [0], end_angle: [pi]})
        const ctx = view.canvas.create_layer().ctx
        using translate = restorable(sinon.spy(ctx, "translate"))
        using rotate = restorable(sinon.spy(ctx, "rotate"))
        using arc = restorable(sinon.spy(ctx, "arc"))
        ;(view as any)._paint(ctx, [0], {
          sx: [10], sy: [20], sradius: [100],
          start_angle: {get: () => start}, end_angle: {get: () => end},
        })
        const fraction = placement == "middle" ? 0.5 : placement
        const angle = start + fraction*sweep
        const [x, y] = translate.firstCall.args
        expect(Math.abs(x - (10 + 100*Math.cos(angle))) < 1e-9).to.be.true
        expect(Math.abs(y - (20 + 100*Math.sin(angle))) < 1e-9).to.be.true
        const chord_half_angle = Math.min(0.2, fraction*Math.abs(sweep))/2
        const expected_rotation = angle + (direction == "clock" ? pi - chord_half_angle : chord_half_angle)
        // Compare unit direction vectors so equivalent wrapped rotations match.
        const rotation = rotate.firstCall.args[0]
        expect(Math.abs(Math.cos(rotation) - Math.cos(expected_rotation)) < 1e-9).to.be.true
        expect(Math.abs(Math.sin(rotation) - Math.sin(expected_rotation)) < 1e-9).to.be.true
        expect(arc.firstCall.args.slice(3)).to.be.equal([start, start + sweep, direction == "anticlock"])
      })
    }
  }

  for (const direction of ["clock", "anticlock"] as const) {
    for (const placement of ["start", "end"] as const) {
      it(`should preserve endpoint tangents and inset for ${placement} on ${direction} arcs`, async () => {
        const glyph = Arc.create({direction, decorations: [
          PathDecoration.create({node: placement, inset: 10, marking: NormalHead.create({size: 20})}),
        ]})
        const view = await create_glyph_view(glyph, {x: [0], y: [0], radius: [100], start_angle: [0], end_angle: [pi]})
        const ctx = view.canvas.create_layer().ctx
        using translate = restorable(sinon.spy(ctx, "translate"))
        using rotate = restorable(sinon.spy(ctx, "rotate"))
        const sign = direction == "clock" ? 1 : -1
        ;(view as any)._paint(ctx, [0], {
          sx: [0], sy: [0], sradius: [100],
          start_angle: {get: () => 0}, end_angle: {get: () => sign*pi/2},
        })
        const angle = placement == "start" ? sign*0.1 : sign*(pi/2 - 0.1)
        expect(Math.abs(translate.firstCall.args[0] - 100*Math.cos(angle)) < 1e-9).to.be.true
        expect(Math.abs(translate.firstCall.args[1] - 100*Math.sin(angle)) < 1e-9).to.be.true
        const forward_rotation = angle + (direction == "clock" ? pi : 0)
        const expected = forward_rotation + (placement == "start" ? pi : 0)
        expect(Math.abs(Math.cos(rotate.firstCall.args[0]) - Math.cos(expected)) < 1e-9).to.be.true
        expect(Math.abs(Math.sin(rotate.firstCall.args[0]) - Math.sin(expected)) < 1e-9).to.be.true
      })
    }
  }

  for (const direction of ["clock", "anticlock"] as const) {
    it(`should keep zero-radius fractional markings finite for ${direction}`, async () => {
      const glyph = Arc.create({direction, decorations: [0, 0.5, 1].map(placement =>
        PathMarkings.create({positions: [placement], marking: NormalHead.create({size: 20})}))})
      const view = await create_glyph_view(glyph, {x: [0], y: [0], radius: [0], start_angle: [0], end_angle: [pi]})
      const ctx = view.canvas.create_layer().ctx
      using translate = restorable(sinon.spy(ctx, "translate"))
      using rotate = restorable(sinon.spy(ctx, "rotate"))
      ;(view as any)._paint(ctx, [0], {
        sx: [10], sy: [20], sradius: [0],
        start_angle: {get: () => 0}, end_angle: {get: () => pi},
      })
      for (const call of translate.getCalls()) {
        expect(call.args).to.be.equal([10, 20])
      }
      expect(rotate.getCalls().every(call => Number.isFinite(call.args[0]))).to.be.true
    })
  }
})

describe("Arc bounds", () => {
  const data = {
    x: [1, 10, 5, 30],
    y: [10, 60, 30, 80],
    radius: [1, 2, 3, 4],
  }

  it("should include data-unit radii in its bounds", async () => {
    const glyph = Arc.create({radius: {field: "radius"}})
    const view = await create_glyph_view(glyph, data)

    expect(view.bounds()).to.be.equal({x0: 0, y0: 9, x1: 34, y1: 84})
  })

  it("should not interpret screen-unit radii as data-unit bounds", async () => {
    const glyph = Arc.create({radius: {field: "radius", units: "screen"}})
    const view = await create_glyph_view(glyph, data)

    expect(view.bounds()).to.be.equal({x0: 1, y0: 10, x1: 30, y1: 80})
  })
})
