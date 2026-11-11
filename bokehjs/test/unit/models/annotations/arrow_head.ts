import * as sinon from "sinon"
import {expect} from "#framework/assertions"
import {restorable} from "#framework/util"
import {create_glyph_view} from "../glyphs/_util"
import {NormalHead} from "@bokehjs/models/annotations/arrow_head"
import {Segment} from "@bokehjs/models/glyphs/segment"
import {MultiLine} from "@bokehjs/models/glyphs/multi_line"
import {Arc} from "@bokehjs/models/glyphs/arc"
import {PathMarking, PathMarkings} from "@bokehjs/models/graphics/decoration"
import {hit_decoration, path_segments, position_decoration} from "@bokehjs/models/glyphs/decorated_path"

describe("Arrowhead angle overrides", () => {
  it("should resolve field angles in degrees for each path", async () => {
    const decoration = PathMarking.create({
      node: "end", marking: NormalHead.create(), angle: {field: "rotation", units: "deg"},
    })
    const data = {x0: [0, 0], y0: [0, 1], x1: [100, 100], y1: [0, 1], rotation: [0, 90]}
    const view = await create_glyph_view(Segment.create({decorations: [decoration]}), data)
    const placement = view.decorations.get(decoration)!
    expect(placement.resolve_angle(0, Math.PI/2, Math.PI/2)).to.be.equal(Math.PI/2)
    expect(Math.abs(placement.resolve_angle(1, Math.PI/2, Math.PI/2)) < 1e-6).to.be.true
    expect(placement.shaft_inset(0)).to.be.equal(25)
    expect(placement.shaft_inset(1)).to.be.equal(0)
  })

  for (const [reference, expected] of [["left", 0], ["right", Math.PI]] as const) {
    it(`should orient the ${reference} normal from the forward tangent at a named start`, async () => {
      const decoration = PathMarking.create({node: "start", marking: NormalHead.create(), angle_reference: reference})
      const view = await create_glyph_view(MultiLine.create({decorations: [decoration]}), {xs: [[0, 100]], ys: [[0, 0]]})
      const placement = view.decorations.get(decoration)!
      const segments = path_segments([0, 100], [0, 0])
      expect(position_decoration(placement, 0, segments, 100).angle).to.be.equal(expected)
    })
  }

  for (const [name, create] of [
    ["Segment", (decoration: PathMarking | PathMarkings) => Segment.create({decorations: [decoration]})],
    ["MultiLine", (decoration: PathMarking | PathMarkings) => MultiLine.create({decorations: [decoration]})],
    ["Arc", (decoration: PathMarking | PathMarkings) => Arc.create({decorations: [decoration]})],
  ] as const) {
    for (const node of ["start", "end", 0.25] as const) {
      it(`should paint the fixed angle at the ${node} of ${name}`, async () => {
        const marking = NormalHead.create()
        const decoration = typeof node == "number"
          ? PathMarkings.create({positions: [node], marking, angle_reference: "screen", angle: 0.3})
          : PathMarking.create({node, marking, angle_reference: "screen", angle: 0.3})
        const glyph = create(decoration)
        const data = glyph instanceof Segment ? {x0: [0], y0: [0], x1: [100], y1: [0]}
          : glyph instanceof MultiLine ? {xs: [[0, 100]], ys: [[0, 0]]}
          : {x: [0], y: [0], radius: [100], start_angle: [0], end_angle: [Math.PI]}
        const view = await create_glyph_view(glyph, data as any)
        const ctx = view.canvas.create_layer().ctx
        using rotate = restorable(sinon.spy(ctx, "rotate"))
        view.paint(ctx, new Int32Array([0]))
        sinon.assert.calledWithExactly(rotate, -0.3)
      })
    }
  }

  it("should hit the head at its overridden orientation", async () => {
    const decoration = PathMarking.create({node: "end", marking: NormalHead.create({size: 20}), angle_reference: "screen"})
    const view = await create_glyph_view(MultiLine.create({decorations: [decoration]}), {xs: [[0, 100]], ys: [[0, 0]]})
    const marking = view.decorations.get(decoration)!
    const segments = path_segments([0, 100], [0, 0])
    expect(hit_decoration({x: 100, y: 10}, marking, 0, segments)).to.be.equal(0)
    expect(hit_decoration({x: 90, y: 0}, marking, 0, segments)).to.be.null
  })
})
