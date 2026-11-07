import {expect, expect_instanceof} from "#framework/assertions"
import {display, fig} from "#framework/layouts"
import {restorable} from "#framework/util"
import {spy} from "sinon"
import {RecordSource} from "./record_source"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {IndexedSubset} from "@bokehjs/models/sources/indexed_subset"
import {GroupFilter} from "@bokehjs/models/filters/group_filter"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import type {TooltipVars} from "@bokehjs/models/tools/inspectors/hover_tool"
import {HoverTool} from "@bokehjs/models/tools/inspectors/hover_tool"
import type {ScatterView} from "@bokehjs/models/glyphs/scatter"
import {Stack} from "@bokehjs/models/expressions/stack"
import {dict} from "@bokehjs/core/util/object"
import {Document} from "@bokehjs/document"
import {ModelChangedEvent} from "@bokehjs/document/events"

function source(): RecordSource {
  return RecordSource.create({records: [
    {x: 1, y: 2, name: "alpha", color: "red", size: 12, group: "a"},
    {x: 3, y: 4, name: "beta", color: "blue", size: 18, group: "b"},
    {x: 5, y: 6, name: "gamma", color: "green", size: 24, group: "a"},
  ]})
}

describe("IndexedDataSource", () => {
  it("should preserve inferred source types in plotting APIs", () => {
    const plot = fig([300, 300])
    const implicit: ColumnDataSource = plot.scatter([1], [2]).data_source
    implicit.patch({x: [[0, 3]]})
    implicit.stream({x: [4], y: [5]})
    expect(implicit.get_column("x")).to.be.equal([3, 4])
    const supplied = ColumnDataSource.create({data: {x: [1], y: [2]}})
    const explicit: ColumnDataSource = plot.scatter({source: supplied}).data_source
    expect(explicit === supplied).to.be.equal(true)
    const literal: ColumnDataSource = plot.scatter({source: {x: [1], y: [2]}}).data_source
    expect(literal.get_column("x")).to.be.equal([1])
    const records = source()
    const indexed: RecordSource = plot.scatter({source: records}).data_source
    expect(indexed === records).to.be.equal(true)
    const added: RecordSource = plot.add_glyph(plot.scatter().glyph, records).data_source
    expect(added === records).to.be.equal(true)
    const default_added: ColumnDataSource = plot.add_glyph(plot.scatter().glyph).data_source
    expect(default_added).to.be.instanceof(ColumnDataSource)
  })

  for (const output_backend of ["canvas", "webgl"] as const) {
    it(`renders and selects filtered records on ${output_backend}`, async () => {
      const records = source()
      const plot = fig([300, 300], {output_backend, x_range: [0, 8], y_range: [0, 8]})
      const filtered = IndexedSubset.create({filter: GroupFilter.create({field_name: "group", group: "a"})})
      const first = plot.scatter({source: records, x: {field: "x"}, y: {field: "y"}, size: {field: "size"}, color: {field: "color"}, view: filtered})
      const {view} = await display(plot)
      const first_view = view.owner.get_one(first)
      const glyph = first_view.glyph as ScatterView
      expect([...glyph.x]).to.be.equal([1, 5])
      expect([...glyph.y]).to.be.equal([2, 6])
      expect(glyph.has_webgl()).to.be.equal(output_backend == "webgl")
      const geometry = {type: "point", sx: glyph.sx[1], sy: glyph.sy[1]} as const
      records.selection_manager.select([first_view], geometry, true)
      await view.ready
      expect(records.selected.indices).to.be.equal([2])
    })
  }

  it("renders record tooltips and reconnects inspection after source replacement", async () => {
    const records = source()
    const plot = fig([300, 300])
    const renderer = plot.scatter({source: records})
    const hover = HoverTool.create({renderers: [renderer], tooltips: "@name ($index)"})
    plot.add_tools(hover)
    const {view} = await display(plot)
    const renderer_view = view.owner.get_one(renderer)
    const glyph = renderer_view.glyph as ScatterView
    const geometry = {type: "point", sx: glyph.sx[2], sy: glyph.sy[2]} as const
    records.selection_manager.inspect(renderer_view, geometry)
    expect(records.inspected.indices).to.be.equal([2])
    const hover_view = view.owner.get_one(hover)
    const content = hover_view._render_tooltips(records, {index: 2} as TooltipVars)
    expect_instanceof(content, Element)
    expect(content.textContent).to.be.equal("gamma (2)")
    using update = restorable(spy(hover_view, "_update"))
    const replacement = source()
    renderer.data_source = replacement
    await view.ready
    replacement.selection_manager.inspect(renderer_view, geometry)
    records.inspect.emit([renderer, {geometry}])
    expect(update.callCount).to.be.equal(1)
  })

  it("reconnects replacement views and ignores the previous filter", async () => {
    const records = source()
    const plot = fig([300, 300])
    const filter = GroupFilter.create({field_name: "group", group: "a"})
    const renderer = plot.scatter({source: records, x: {field: "x"}, y: {field: "y"}, view: IndexedSubset.create({filter})})
    const {view} = await display(plot)
    const renderer_view = view.owner.get_one(renderer)
    filter.group = "b"
    await view.ready
    expect([...renderer.view.indices]).to.be.equal([1])
    renderer.view = IndexedSubset.create({filter: IndexFilter.create({indices: [0, 2]})})
    records.records = [{x: 10, y: 20}, {x: 30, y: 40}, {x: 50, y: 60}]
    await view.ready
    expect([...(renderer_view.glyph as ScatterView).x]).to.be.equal([10, 50])
    using prepare = restorable(spy(renderer_view, "_set_data"))
    filter.group = "a"
    await view.ready
    expect(prepare.callCount).to.be.equal(0)
    dict(records.records[0]).set("x", 17)
    records.data_changed.emit({fields: ["x"], indices: [0], structural: false})
    await view.ready
    expect([...(renderer_view.glyph as ScatterView).x]).to.be.equal([17, 50])
  })

  it("prunes selection on shrink and disconnects replaced renderer sources", async () => {
    const records = source()
    const plot = fig([300, 300])
    const renderer = plot.scatter({source: records})
    const {view} = await display(plot)
    records.selected.indices = [0, 2]
    records.inspected.indices = [2]
    records.records = [{x: 7, y: 8}]
    await view.ready
    expect(records.selected.indices).to.be.equal([0])
    expect(records.inspected.indices).to.be.equal([])
    const replacement = RecordSource.create({records: [{x: 9, y: 10}]})
    renderer.data_source = replacement
    await view.ready
    using prepare = restorable(spy(view.owner.get_one(renderer), "_set_data"))
    records.records = []
    await view.ready
    expect(prepare.callCount).to.be.equal(0)
    expect([...(view.owner.get_one(renderer).glyph as ScatterView).x]).to.be.equal([9])
  })

  it("invalidates expressions for in-place record updates", () => {
    const values = RecordSource.create({records: [{value: 2}, {value: 4}]})
    const sum = Stack.create({fields: ["value"]})
    expect([...sum.v_compute(values)]).to.be.equal([2, 4])
    dict(values.records[1]).set("value", 8)
    values.data_changed.emit({fields: ["value"], indices: [1], structural: false})
    expect([...sum.v_compute(values)]).to.be.equal([2, 8])
  })

  it("should request only glyph fields without materializing unused records", async () => {
    const records = RecordSource.create({records: [{x: 1, y: 2, unused: {large: [1, 2, 3]}}]})
    const plot = fig([300, 300])
    plot.scatter({source: records, x: {field: "x"}, y: {field: "y"}})
    await display(plot)
    expect([...records.requested_fields].sort()).to.be.equal(["x", "y"])
  })

  it("should remove tooltip views and inspection subscriptions when tooltips are disabled", async () => {
    const records = source()
    const plot = fig([300, 300])
    const renderer = plot.scatter({source: records, x: {field: "x"}, y: {field: "y"}})
    const hover = HoverTool.create({renderers: [renderer], tooltips: [["name", "@name"]]})
    plot.add_tools(hover)
    const {view} = await display(plot)
    const hover_view = view.owner.get_one(hover)
    const tooltip = hover_view.ttmodels.get(renderer)!
    const tooltip_view = view.owner.get_one(tooltip)
    using update = restorable(spy(hover_view, "_update"))
    hover.tooltips = null
    await view.ready
    expect(tooltip_view.is_destroyed).to.be.true
    records.inspect.emit([renderer, {geometry: {type: "point", sx: 0, sy: 0}}])
    expect(update.callCount).to.be.equal(0)
    renderer.data_source = source()
    await view.ready
    expect(hover_view.ttmodels.size).to.be.equal(0)
    hover.tooltips = [["name", "@name"]]
    await view.ready
    renderer.data_source.selection_manager.inspect(view.owner.get_one(renderer), {type: "point", sx: 0, sy: 0})
    expect(update.callCount).to.be.equal(1)
  })

  it("should fully prepare structural changes even when affected indices are supplied", async () => {
    const records = source()
    const plot = fig([300, 300])
    const renderer = plot.scatter({source: records, x: {field: "x"}, y: {field: "y"}})
    const {view} = await display(plot)
    const glyph = view.owner.get_one(renderer).glyph
    using prepare = restorable(spy(glyph, "set_data"))
    records.records.reverse()
    records.data_changed.emit({indices: [0], structural: true})
    await view.ready
    expect(prepare.callCount).to.be.equal(1)
    expect(prepare.lastCall.args[2]).to.be.undefined
    expect([...(glyph as ScatterView).x]).to.be.equal([5, 3, 1])
  })

  it("should retain CDS property-level notifications and synchronization mode with no_change", async () => {
    const cds = ColumnDataSource.create({data: {x: [1, 2, 3], y: [2, 3, 4], group: ["a", "b", "a"]}})
    const plot = fig([300, 300])
    const renderer = plot.scatter({
      source: cds, x: {field: "x"}, y: {field: "y"},
      view: IndexedSubset.create({filter: GroupFilter.create({field_name: "group", group: "a"})}),
    })
    const {view, doc} = await display(plot)
    cds.selected.indices = [0, 2]
    const events: ModelChangedEvent[] = []
    doc.on_change((event) => {
      if (event instanceof ModelChangedEvent && event.model === cds.selected) {
        events.push(event)
      }
    })
    cds.setv({data: {x: [7], y: [8], group: ["b"]}}, {no_change: true, sync: false})
    await view.ready
    expect(cds.selected.indices).to.be.equal([0])
    expect([...renderer.view.indices]).to.be.equal([])
    expect(events.some((event) => event.sync)).to.be.false
    expect((view.owner.get_one(renderer).glyph as ScatterView).data_size).to.be.equal(0)
  })

  it("should preserve CDS field identity and shaped row access", () => {
    const x = new Float64Array([1, 2])
    const cds = ColumnDataSource.create({data: {x, y: [3, 4]}})
    expect(cds.get_field("x") === x).to.be.true
    expect(cds.get_field("x") === cds.get_column("x")).to.be.true
    expect(cds.get_record(1)).to.be.equal(cds.get_row(1))
    expect(cds.fields()).to.be.equal(cds.columns())
    cds.patch({x: [[1, 5]]})
    expect(cds.get_field("x") === x).to.be.true
  })

  it("should suppress selection echoes when receiving record replacements", () => {
    const records = source()
    const doc = new Document()
    doc.add_root(records)
    records.selected.indices = [2]
    const events: ModelChangedEvent[] = []
    doc.on_change((event) => {
      if (event instanceof ModelChangedEvent) {
        events.push(event)
      }
    })
    records.setv({records: []}, {sync: false})
    expect(records.selected.indices).to.be.equal([])
    expect(events.some((event) => event.model === records.selected && event.sync)).to.be.false
  })
})
