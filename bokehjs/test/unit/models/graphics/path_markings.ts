import * as sinon from "sinon"
import {expect} from "#framework/assertions"
import {restorable} from "#framework/util"
import {create_glyph_renderer_view, create_glyph_view} from "../glyphs/_util"
import {PathPlacement} from "@bokehjs/models/graphics/path_placement"
import {NormalHead} from "@bokehjs/models/annotations/arrow_head"
import {MultiLine} from "@bokehjs/models/glyphs/multi_line"
import {Line} from "@bokehjs/models/glyphs/line"
import {Segment} from "@bokehjs/models/glyphs/segment"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {BitSet} from "@bokehjs/core/util/bitset"
import {path_segments, hit_path_marking, path_marking_hits_rect, path_marking_hits_span} from "@bokehjs/models/glyphs/marked_path"

describe("Path markings", () => {
  it("should paint and hit every repeated marking on a Segment", async () => {
    const model = PathPlacement.create({marking: NormalHead.create({size: 12}), positions: [0.25, 0.75]})
    const view = await create_glyph_view(Segment.create({path_markings: [model]}), {x0: [0], y0: [0], x1: [100], y1: [0]})
    const ctx = view.canvas.create_layer().ctx
    using translate = restorable(sinon.spy(ctx, "translate"))
    ;(view as any)._paint(ctx, [0], {sx0: [0], sy0: [0], sx1: [100], sy1: [0]})
    expect(translate.getCalls().map(call => call.args)).to.be.equal([[25, 0], [75, 0]])
    const hit_x = view.sx0[0] + 0.75*(view.sx1[0] - view.sx0[0]) - 3
    expect((view as any)._hit_path_marking({x: hit_x, y: view.sy0[0]}, 0)).to.be.true
    const path_marking = view.path_markings.get(model)!
    const segments = path_segments([0, 100], [0, 0])
    expect(hit_path_marking({x: 22, y: 0}, path_marking, 0, segments)).to.be.equal(0)
    expect(hit_path_marking({x: 72, y: 0}, path_marking, 0, segments)).to.be.equal(0)
    expect(hit_path_marking({x: 50, y: 0}, path_marking, 0, segments)).to.be.equal(null)
    expect(path_marking_hits_rect(path_marking, 0, segments, {type: "rect", sx0: 70, sx1: 74, sy0: -2, sy1: 2})).to.be.equal(0)
    expect(path_marking_hits_span(path_marking, 0, segments, "h", 72)).to.be.equal(0)
  })

  it("should resolve ragged field positions through filtering and source patches", async () => {
    const {glyph: view, model: renderer, plot_view: plot} = await create_glyph_renderer_view(MultiLine.create(), {
      xs: [[0, 100], [0, 100], [0, 100]], ys: [[0, 0], [30, 30], [60, 60]],
      positions: [[0.25, 0.75], [], [0, 0.5, 1]],
    } as any)
    const model = renderer.add_arrowheads({at: {field: "positions"}, head: NormalHead.create()})
    await plot.ready
    expect(view.path_markings.get(model)!.placements(1)).to.be.equal([])
    renderer.view.filter = IndexFilter.create({indices: [0, 2]})
    await plot.ready
    const path_marking = view.path_markings.get(model)!
    expect(path_marking.placements(0)).to.be.equal([0.25, 0.75])
    expect(path_marking.placements(1)).to.be.equal([0, 0.5, 1])
    renderer.data_source.patch({positions: [[2, [0.1, 0.9]]]})
    await plot.ready
    expect(path_marking.placements(1)).to.be.equal([0.1, 0.9])
    model.positions = []
    await plot.ready
    expect(path_marking.placements(0)).to.be.equal([])
  })

  it("should reject invalid field-backed arrowhead positions when resolving a row", async () => {
    const {glyph: view, model: renderer, plot_view: plot} = await create_glyph_renderer_view(
      MultiLine.create(), {xs: [[0, 100]], ys: [[0, 0]], positions: [[]]} as any,
    )
    const markings = renderer.add_arrowheads({at: {field: "positions"}})
    await plot.ready
    const path_marking = view.path_markings.get(markings)!
    const positions = [[], 0.5, [-0.1], [1.1], [NaN], [Infinity], [true]]
    const source = ColumnDataSource.create({data: {positions}})
    path_marking.set_data(source, BitSet.all_set(positions.length))
    expect(path_marking.placements(0)).to.be.equal([])
    for (let i = 1; i < positions.length; i++) {
      expect(() => path_marking.placements(i)).to.throw(Error, "lists of finite fractions")
    }
  })

  it("should style repeated Line markings by the segment beneath each marking", async () => {
    const model = PathPlacement.create({marking: NormalHead.create(), positions: [0.25, 0.75]})
    const view = await create_glyph_view(Line.create({path_markings: [model]}), {x: [0, 50, 100], y: [0, 0, 0]})
    const {renderer} = view
    renderer.model.data_source.selected.indices = [0, 1]
    await renderer.ready
    const selected = [...renderer.selection_glyph.path_markings.values()][0].marking
    const nonselected = [...renderer.nonselection_glyph.path_markings.values()][0].marking
    using selected_paint = restorable(sinon.spy(selected, "paint"))
    using nonselected_paint = restorable(sinon.spy(nonselected, "paint"))
    renderer.paint(view.canvas.create_layer().ctx)
    sinon.assert.calledOnce(selected_paint)
    sinon.assert.calledOnce(nonselected_paint)
  })
})
