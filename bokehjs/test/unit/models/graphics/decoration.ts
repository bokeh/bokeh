import {expect} from "#framework/assertions"
import {assert} from "@bokehjs/core/util/assert"
import {create_glyph_view} from "../glyphs/_util"
import {Segment} from "@bokehjs/models/glyphs/segment"
import {NormalHead, OpenHead} from "@bokehjs/models/annotations/arrow_head"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {Decoration, PathDecoration, PathMarkings} from "@bokehjs/models/graphics/decoration"
import {ModelChangedEvent, ColumnsPatchedEvent} from "@bokehjs/document/events"

describe("Decoration models", () => {
  it("should leave marking and path placement properties to concrete decorations", () => {
    const properties = Decoration.prototype._props
    for (const name of ["marking", "node", "inset", "positions"]) {
      expect(name in properties).to.be.false
    }

    const marking = NormalHead.create()
    for (const decoration of [PathDecoration.create({marking}), PathMarkings.create({marking})]) {
      expect(decoration).to.be.instanceof(Decoration)
      expect(decoration.marking).to.be.equal(marking)
    }
  })
})

describe("PathDecoration live PATCH-DOC updates", () => {
  it("should update filtered field uniforms and inherited colors through a column patch", async () => {
    const glyph = Segment.create({line_color: {field: "color"}})
    const view = await create_glyph_view(glyph, {
      x0: [0, 0], y0: [20, 50], x1: [100, 100], y1: [20, 50],
      size: [10, 20], color: ["red", "blue"],
    } as any)
    const plot = view.renderer.plot_view
    view.renderer.model.view.filter = IndexFilter.create({indices: [1]})
    await plot.ready
    const doc = plot.model.document!
    const decoration = PathDecoration.create({node: "end", marking: NormalHead.create({size: {field: "size"}, inherit_visuals: ["fill_color"]})})
    doc.apply_json_patch(doc.create_json_patch([new ModelChangedEvent(doc, glyph, "decorations", [decoration])]))
    await plot.ready
    const marking = [...view.decorations.values()][0].marking
    expect(marking.size.get(0)).to.be.equal(20)
    const source = view.renderer.model.data_source
    doc.apply_json_patch(doc.create_json_patch([new ColumnsPatchedEvent(doc, source, "data", {size: [[1, 40]], color: [[1, "green"]]})]))
    await plot.ready
    expect(marking.size.get(0)).to.be.equal(40)
    view.paint(view.canvas.create_layer().ctx, [0])
    expect((marking as any).visuals.fill.fill_color.get(0)).to.be.equal(view.line_color.get(0))
  })

  it("should keep only the latest marking and dispose decorations removed while rebuilding", async () => {
    const decoration = PathDecoration.create({node: "end", marking: NormalHead.create()})
    const glyph = Segment.create({decorations: [decoration]})
    const view = await create_glyph_view(glyph, {x0: [0], y0: [50], x1: [100], y1: [50]})
    const plot = view.renderer.plot_view
    const discarded = OpenHead.create({size: 15})
    const latest = NormalHead.create({size: 40})
    decoration.marking = discarded
    decoration.marking = latest
    await plot.ready
    expect(view.decorations.get(decoration)!.marking.model).to.be.equal(latest)
    expect(view.owner.find_all(discarded).length).to.be.equal(0)
    const transient = PathDecoration.create({node: "start", marking: OpenHead.create()})
    glyph.decorations = [decoration, transient]
    glyph.decorations = []
    await plot.ready
    expect(view.decorations.size).to.be.equal(0)
    expect(view.owner.find_all(transient).length).to.be.equal(0)
    expect(view.owner.find_all(latest).length).to.be.equal(0)
  })

  it("should build, replace, update, and remove decoration views after display", async () => {
    const glyph = Segment.create()
    const view = await create_glyph_view(glyph, {
      x0: [0], y0: [50], x1: [100], y1: [50],
    })
    const plot = view.renderer.plot_view
    const doc = plot.model.document!
    const head = NormalHead.create({size: 12, inherit_visuals: ["fill_color"]})
    const decoration = PathDecoration.create({node: "end", inset: 20, marking: head})
    const patch = doc.create_json_patch([new ModelChangedEvent(doc, glyph, "decorations", [decoration])])
    doc.apply_json_patch(patch)
    await plot.ready
    const added = glyph.decorations[0]
    assert(added instanceof PathDecoration)
    const added_view = view.decorations.get(added)!
    expect(added_view).to.not.be.undefined
    expect(added_view.marking.size.get(0)).to.be.equal(12)
    for (const state of [view.renderer.selection_glyph, view.renderer.nonselection_glyph, view.renderer.muted_glyph]) {
      expect(state.decorations.size).to.be.equal(1)
    }
    const sx = view.sx1[0], sy = view.sy1[0]
    expect(view.hit_test({type: "point", sx: sx - 2, sy})?.indices).to.be.equal([])
    expect(view.hit_test({type: "point", sx: sx - 26, sy})?.indices).to.be.equal([0])

    const old_marking = added_view.marking
    doc.apply_json_patch(doc.create_json_patch([
      new ModelChangedEvent(doc, added, "marking", OpenHead.create({size: 30})),
      new ModelChangedEvent(doc, added, "inset", 0),
    ]))
    await plot.ready
    expect(added_view.marking.model).to.be.instanceof(OpenHead)
    expect(old_marking.is_destroyed).to.be.true
    expect(added_view.marking.size.get(0)).to.be.equal(30)
    expect(view.hit_test({type: "point", sx: sx - 15, sy})?.indices).to.be.equal([0])

    doc.apply_json_patch(doc.create_json_patch([
      new ModelChangedEvent(doc, added.marking, "size", 40),
      new ModelChangedEvent(doc, added, "inset", 25),
    ]))
    await plot.ready
    expect(added_view.marking.size.get(0)).to.be.equal(40)
    expect(added_view.inset.get(0)).to.be.equal(25)
    expect(view.hit_test({type: "point", sx: sx - 2, sy})?.indices).to.be.equal([])

    doc.apply_json_patch(doc.create_json_patch([new ModelChangedEvent(doc, glyph, "decorations", [])]))
    await plot.ready
    expect(view.decorations.size).to.be.equal(0)
    expect(added_view.is_destroyed).to.be.true
    expect(added_view.marking.is_destroyed).to.be.true
    for (const state of [view.renderer.selection_glyph, view.renderer.nonselection_glyph, view.renderer.muted_glyph]) {
      expect(state.decorations.size).to.be.equal(0)
    }
    expect(view.hit_test({type: "point", sx: sx - 2, sy})?.indices).to.be.equal([0])
  })
})
