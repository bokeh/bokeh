import {expect} from "#framework/assertions"
import {assert} from "@bokehjs/core/util/assert"
import {create_glyph_view} from "../glyphs/_util"
import {Segment} from "@bokehjs/models/glyphs/segment"
import {NormalHead, OpenHead} from "@bokehjs/models/annotations/arrow_head"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {PathPlacement} from "@bokehjs/models/graphics/path_placement"
import {ModelChangedEvent, ColumnsPatchedEvent} from "@bokehjs/document/events"

describe("PathPlacement placement updates", () => {
  const transitions: ["end" | number[], "end" | number[]][] = [["end", [1]], [[1], "end"]]
  for (const [before, after] of transitions) {
    it(`should switch from ${typeof before == "string" ? "named" : "fractional"} to ${typeof after == "string" ? "named" : "fractional"} placement without replacing the view`, async () => {
      const path_marking = PathPlacement.create({marking: NormalHead.create(), positions: before})
      const view = await create_glyph_view(Segment.create({path_markings: [path_marking]}), {
        x0: [0], y0: [0], x1: [100], y1: [0],
      })
      const path_marking_view = view.path_markings.get(path_marking)!
      path_marking.positions = after
      await view.renderer.plot_view.ready
      expect(view.path_markings.get(path_marking)).to.be.identical(path_marking_view)
      expect(path_marking_view.placements(0)).to.be.equal(typeof after == "string" ? [after] : Array.from(after))
      expect(path_marking_view.node).to.be.equal(typeof after == "string" ? after : null)
    })
  }
})

describe("PathPlacement live PATCH-DOC updates", () => {
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
    const path_marking = PathPlacement.create({positions: "end", marking: NormalHead.create({size: {field: "size"}, inherit_visuals: ["fill_color"]})})
    doc.apply_json_patch(doc.create_json_patch([new ModelChangedEvent(doc, glyph, "path_markings", [path_marking])]))
    await plot.ready
    const marking = [...view.path_markings.values()][0].marking
    expect(marking.size.get(0)).to.be.equal(20)
    const source = view.renderer.model.data_source
    doc.apply_json_patch(doc.create_json_patch([new ColumnsPatchedEvent(doc, source, "data", {size: [[1, 40]], color: [[1, "green"]]})]))
    await plot.ready
    expect(marking.size.get(0)).to.be.equal(40)
    view.paint(view.canvas.create_layer().ctx, new Int32Array([0]))
    expect((marking as any).visuals.fill.fill_color.get(0)).to.be.equal(view.line_color.get(0))
  })

  it("should keep only the latest marking and dispose path markings removed while rebuilding", async () => {
    const path_marking = PathPlacement.create({positions: "end", marking: NormalHead.create()})
    const glyph = Segment.create({path_markings: [path_marking]})
    const view = await create_glyph_view(glyph, {x0: [0], y0: [50], x1: [100], y1: [50]})
    const plot = view.renderer.plot_view
    const discarded = OpenHead.create({size: 15})
    const latest = NormalHead.create({size: 40})
    path_marking.marking = discarded
    path_marking.marking = latest
    await plot.ready
    expect(view.path_markings.get(path_marking)!.marking.model).to.be.equal(latest)
    expect(view.owner.find_all(discarded).length).to.be.equal(0)
    const transient = PathPlacement.create({positions: "start", marking: OpenHead.create()})
    glyph.path_markings = [path_marking, transient]
    glyph.path_markings = []
    await plot.ready
    expect(view.path_markings.size).to.be.equal(0)
    expect(view.owner.find_all(transient).length).to.be.equal(0)
    expect(view.owner.find_all(latest).length).to.be.equal(0)
  })

  it("should build, replace, update, and remove path marking views after display", async () => {
    const glyph = Segment.create()
    const view = await create_glyph_view(glyph, {
      x0: [0], y0: [50], x1: [100], y1: [50],
    })
    const plot = view.renderer.plot_view
    const doc = plot.model.document!
    const head = NormalHead.create({size: 12, inherit_visuals: ["fill_color"]})
    const path_marking = PathPlacement.create({positions: "end", inset: 20, marking: head})
    const patch = doc.create_json_patch([new ModelChangedEvent(doc, glyph, "path_markings", [path_marking])])
    doc.apply_json_patch(patch)
    await plot.ready
    const added = glyph.path_markings[0]
    assert(added instanceof PathPlacement)
    const added_view = view.path_markings.get(added)!
    expect(added_view).to.not.be.undefined
    expect(added_view.marking.size.get(0)).to.be.equal(12)
    for (const state of [view.renderer.selection_glyph, view.renderer.nonselection_glyph, view.renderer.muted_glyph]) {
      expect(state.path_markings.size).to.be.equal(1)
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

    doc.apply_json_patch(doc.create_json_patch([new ModelChangedEvent(doc, glyph, "path_markings", [])]))
    await plot.ready
    expect(view.path_markings.size).to.be.equal(0)
    expect(added_view.is_destroyed).to.be.true
    expect(added_view.marking.is_destroyed).to.be.true
    for (const state of [view.renderer.selection_glyph, view.renderer.nonselection_glyph, view.renderer.muted_glyph]) {
      expect(state.path_markings.size).to.be.equal(0)
    }
    expect(view.hit_test({type: "point", sx: sx - 2, sy})?.indices).to.be.equal([0])
  })
})
