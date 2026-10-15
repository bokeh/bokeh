import {expect} from "#framework/assertions"
import {create_glyph_view} from "../glyphs/_util"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import type {SegmentView} from "@bokehjs/models/glyphs/segment"
import {Segment} from "@bokehjs/models/glyphs/segment"
import type {NormalHeadView} from "@bokehjs/models/annotations/arrow_head"
import {NormalHead} from "@bokehjs/models/annotations/arrow_head"
import {PathDecoration} from "@bokehjs/models/graphics/decoration"

describe("Marking inherited visuals", () => {
  it("should resolve fields and live updates per host while preserving explicit overrides", async () => {
    const head = NormalHead.create({inherit_visuals: ["line_color", "fill_color", "fill_alpha"], line_width: 7})
    const decoration = PathDecoration.create({marking: head, node: "end"})
    const glyph = Segment.create({line_color: {field: "color"}, line_alpha: 0.6, decorations: [decoration]})
    const view = await create_glyph_view(glyph, {x0: [0, 0], y0: [20, 40], x1: [100, 100], y1: [20, 40], color: ["red", "blue"]} as any)
    const marking = view.decorations.get(decoration)!.marking as NormalHeadView
    const ctx = view.canvas.create_layer().ctx
    view.paint(ctx, [0, 1])
    expect(marking.visuals.fill.fill_color.get(0)).to.be.equal(view.line_color.get(0) as number)
    expect(marking.visuals.fill.fill_color.get(1)).to.be.equal(view.line_color.get(1) as number)
    expect(marking.visuals.fill.fill_alpha.get(0)).to.be.equal(0.6)
    expect(marking.visuals.line.line_width.get(0)).to.be.equal(7)

    glyph.line_color = "green"
    glyph.line_alpha = 0.3
    await view.renderer.ready
    view.paint(ctx, [0, 1])
    expect(marking.visuals.fill.fill_color.get(1)).to.be.equal(view.line_color.get(1) as number)
    expect(marking.visuals.fill.fill_alpha.get(1)).to.be.equal(0.3)

    const other = Segment.create({line_color: "purple", decorations: [decoration]})
    const other_renderer = GlyphRenderer.create({glyph: other, data_source: ColumnDataSource.create({data: {x0: [0], y0: [50], x1: [100], y1: [50]}})})
    const plot = view.renderer.plot_view
    plot.model.renderers = [...plot.model.renderers, other_renderer]
    await plot.ready
    const other_view = plot.owner.get_one(other_renderer).glyph as SegmentView
    other_view.paint(other_view.canvas.create_layer().ctx, [0])
    const other_marking = other_view.decorations.get(decoration)!.marking as NormalHeadView
    expect(other_marking.visuals.fill.fill_color.get(0)).to.be.equal(other_view.line_color.get(0) as number)
    expect(marking.visuals.fill.fill_color.get(0)).to.be.equal(view.line_color.get(0) as number)
    expect(head.fill_color).to.be.equal({value: "black"})

    const nonselection = view.renderer.nonselection_glyph as SegmentView
    nonselection.paint(ctx, [0])
    const state_marking = [...nonselection.decorations.values()][0].marking as NormalHeadView
    expect(state_marking.visuals.fill.fill_alpha.get(0)).to.be.equal(nonselection.visuals.line.line_alpha.get(0))

    head.inherit_visuals = []
    await marking.ready
    view.paint(ctx, [0])
    expect(marking.visuals.fill.fill_color.get(0)).to.not.be.equal(view.line_color.get(0) as number)
  })
})
