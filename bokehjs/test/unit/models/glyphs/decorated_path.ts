import {expect} from "#framework/assertions"
import {assert} from "@bokehjs/core/util/assert"
import {cubic_path, path_length, path_segments, position_decoration, trim_path} from "@bokehjs/models/glyphs/decorated_path"

import {create_glyph_view} from "./_util"
import {Line} from "@bokehjs/models/glyphs/line"
import {PathDecoration, PathMarkings} from "@bokehjs/models/graphics/decoration"
import {NormalHead} from "@bokehjs/models/annotations/arrow_head"

describe("decorated path geometry", () => {
  for (const placement of [0.5, "middle", "end"] as const) {
    it(`should use chord alignment only for fractional and middle placement at ${placement}`, async () => {
      const model = typeof placement == "number"
        ? PathMarkings.create({positions: [placement], marking: NormalHead.create({size: 20})})
        : PathDecoration.create({node: placement, marking: NormalHead.create({size: 20})})
      const view = await create_glyph_view(Line.create({decorations: [model]}), {x: [0, 40, 40], y: [0, 0, 60]})
      const decoration = view.decorations.get(model)!
      const positioned = position_decoration(decoration, 0, path_segments([0, 40, 40], [0, 0, 60]), 100)
      expect(positioned.sx).to.be.equal(40)
      expect(positioned.sy).to.be.equal(placement == "end" ? 60 : 10)
      expect(Math.abs(positioned.angle - (placement == "end" ? Math.PI : 3*Math.PI/4)) < 1e-10).to.be.true
    })
  }

  it("should not align a chord across a NaN gap", async () => {
    const model = PathMarkings.create({positions: [0.5], marking: NormalHead.create({size: 20})})
    const x = [0, 40, NaN, 100, 100], y = [0, 0, NaN, 0, 60]
    const view = await create_glyph_view(Line.create({decorations: [model]}), {x, y})
    const decoration = view.decorations.get(model)
    assert(decoration != null)
    const positioned = position_decoration(decoration, 0, path_segments(x, y), 100)
    expect([positioned.sx, positioned.sy, positioned.angle]).to.be.equal([100, 10, Math.PI])
  })

  it("should preserve NaN gaps and original segment indices while trimming", () => {
    const segments = path_segments([0, 10, NaN, 20, 30], [0, 0, NaN, 0, 0])
    const visible = trim_path(segments, 3, 4)
    expect(visible.map(s => [s.index, s.sx0, s.sx1, s.move])).to.be.equal([[0, 3, 10, true], [3, 20, 26, true]])
  })

  it("should adaptively flatten curved and collinear reversing cubics", () => {
    const curve = cubic_path(0, 0, 0, 100, 100, 100, 100, 0)
    expect(curve.length > 8).to.be.true
    expect(curve[0].sx0).to.be.equal(0)
    expect(curve[curve.length - 1].sx1).to.be.equal(100)
    expect(Math.abs(path_length(curve) - 200) < 0.3).to.be.true
    const reversing = cubic_path(0, 0, 100, 0, -100, 0, 10, 0)
    expect(path_length(reversing) > 100).to.be.true
    expect(cubic_path(NaN, 0, 0, 0, 0, 0, 10, 0)).to.be.equal([])
  })
})
