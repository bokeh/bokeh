import {expect} from "#framework/assertions"
import {create_glyph_view} from "./_util"
import {Segment} from "@bokehjs/models/glyphs/segment"
import {MultiLine} from "@bokehjs/models/glyphs/multi_line"
import {Bezier} from "@bokehjs/models/glyphs/bezier"
import {NormalHead} from "@bokehjs/models/annotations/arrow_head"
import {PathDecoration} from "@bokehjs/models/graphics/decoration"

describe("Path span hit testing", () => {
  for (const decorated of [false, true]) {
    for (const Glyph of [Segment, MultiLine, Bezier]) {
      it(`should follow HoverTool's span convention for ${Glyph.name}, decorated=${decorated}`, async () => {
        const decorations = decorated ? [PathDecoration.create({node: "end", marking: NormalHead.create({size: 12})})] : []
        const glyph = Glyph == Segment ? Segment.create({decorations}) :
          Glyph == Bezier ? Bezier.create({decorations}) : MultiLine.create({decorations})
        const data = Glyph == MultiLine ? {xs: [[20, 80]], ys: [[30, 30]]} : {
          x0: [20], y0: [30], x1: [80], y1: [30], cx0: [40], cy0: [30], cx1: [60], cy1: [30],
        }
        const view = await create_glyph_view(glyph, data as any)
        const sx = view.renderer.xscale.compute(50)
        const sy = view.renderer.yscale.compute(30)
        // HoverTool vline sends "h" and ignores y. Hline sends "v" and ignores x.
        expect(view.hit_test({type: "span", direction: "h", sx, sy: -100})?.indices).to.be.equal([0])
        expect(view.hit_test({type: "span", direction: "h", sx: -100, sy})?.indices).to.be.equal([])
        expect(view.hit_test({type: "span", direction: "v", sx: -100, sy})?.indices).to.be.equal([0])
        expect(view.hit_test({type: "span", direction: "v", sx, sy: -100})?.indices).to.be.equal([])
      })
    }
  }
})
