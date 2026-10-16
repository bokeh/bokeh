import * as sinon from "sinon"
import {expect} from "#framework/assertions"
import {restorable} from "#framework/util"
import {create_glyph_view} from "../glyphs/_util"
import {PathMarkings} from "@bokehjs/models/graphics/decoration"
import {NormalHead} from "@bokehjs/models/annotations/arrow_head"
import {MultiLine} from "@bokehjs/models/glyphs/multi_line"
import {Line} from "@bokehjs/models/glyphs/line"
import {Segment} from "@bokehjs/models/glyphs/segment"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {path_segments, hit_decoration, decoration_hits_rect, decoration_hits_span} from "@bokehjs/models/glyphs/decorated_path"

describe("Path markings", () => {
  it("should paint and hit every repeated marking on a Segment", async () => {
    const model = PathMarkings.create({marking: NormalHead.create({size: 12}), positions: [0.25, 0.75]})
    const view = await create_glyph_view(Segment.create({decorations: [model]}), {x0: [0], y0: [0], x1: [100], y1: [0]})
    const ctx = view.canvas.create_layer().ctx
    using translate = restorable(sinon.spy(ctx, "translate"))
    ;(view as any)._paint(ctx, [0], {sx0: [0], sy0: [0], sx1: [100], sy1: [0]})
    expect(translate.getCalls().map(call => call.args)).to.be.equal([[25, 0], [75, 0]])
    const hit_x = view.sx0[0] + 0.75*(view.sx1[0] - view.sx0[0]) - 3
    expect((view as any)._hit_decoration({x: hit_x, y: view.sy0[0]}, 0)).to.be.true
    const decoration = view.decorations.get(model)!
    const segments = path_segments([0, 100], [0, 0])
    expect(hit_decoration({x: 22, y: 0}, decoration, 0, segments)).to.be.equal(0)
    expect(hit_decoration({x: 72, y: 0}, decoration, 0, segments)).to.be.equal(0)
    expect(hit_decoration({x: 50, y: 0}, decoration, 0, segments)).to.be.equal(null)
    expect(decoration_hits_rect(decoration, 0, segments, {type: "rect", sx0: 70, sx1: 74, sy0: -2, sy1: 2})).to.be.equal(0)
    expect(decoration_hits_span(decoration, 0, segments, "h", 72)).to.be.equal(0)
  })

  it("should resolve ragged field positions through filtering and source patches", async () => {
    const model = PathMarkings.create({marking: NormalHead.create(), positions: {field: "positions"}})
    const view = await create_glyph_view(MultiLine.create({decorations: [model]}), {
      xs: [[0, 100], [0, 100], [0, 100]], ys: [[0, 0], [30, 30], [60, 60]],
      positions: [[0.25, 0.75], [], [0, 0.5, 1]],
    } as any)
    const plot = view.renderer.plot_view
    view.renderer.model.view.filter = IndexFilter.create({indices: [0, 2]})
    await plot.ready
    const decoration = view.decorations.get(model)!
    expect(decoration.placements(0)).to.be.equal([0.25, 0.75])
    expect(decoration.placements(1)).to.be.equal([0, 0.5, 1])
    view.renderer.model.data_source.patch({positions: [[2, [0.1, 0.9]]]})
    await plot.ready
    expect(decoration.placements(1)).to.be.equal([0.1, 0.9])
    model.positions = []
    await plot.ready
    expect(decoration.placements(0)).to.be.equal([])
  })

  it("should style repeated Line markings by the segment beneath each marking", async () => {
    const model = PathMarkings.create({marking: NormalHead.create(), positions: [0.25, 0.75]})
    const view = await create_glyph_view(Line.create({decorations: [model]}), {x: [0, 50, 100], y: [0, 0, 0]})
    const {renderer} = view
    renderer.model.data_source.selected.indices = [0, 1]
    await renderer.ready
    const selected = [...renderer.selection_glyph.decorations.values()][0].marking
    const nonselected = [...renderer.nonselection_glyph.decorations.values()][0].marking
    using selected_paint = restorable(sinon.spy(selected, "paint"))
    using nonselected_paint = restorable(sinon.spy(nonselected, "paint"))
    renderer.paint(view.canvas.create_layer().ctx)
    sinon.assert.calledOnce(selected_paint)
    sinon.assert.calledOnce(nonselected_paint)
  })
})
