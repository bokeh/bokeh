import * as sinon from "sinon"

import {restorable} from "#framework/util"
import {expect} from "#framework/assertions"
import {display, fig} from "#framework/layouts"
import {defer} from "@bokehjs/core/util/defer"
import {CDSViewView} from "@bokehjs/models/sources/cds_view"
import {Patches} from "@bokehjs/models/glyphs/patches"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {IndexedLookup} from "@bokehjs/models/expressions/indexed_lookup"
import type {PatchesView} from "@bokehjs/models/glyphs/patches"
import {CDSView} from "@bokehjs/models/sources/cds_view"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("IndexedLookup rendering", () => {
  it("repaints patches when shared coordinates or connectivity change", async () => {
    const values = ColumnDataSource.create({data: {x: [0, 1, 0], y: [0, 0, 1]}})
    const cells = ColumnDataSource.create({data: {vertices: [[0, 1, 2]]}})
    const xs = IndexedLookup.create({source: values, field: "x", indices: "vertices"})
    const ys = IndexedLookup.create({source: values, field: "y", indices: "vertices"})
    const p = fig([200, 200], {x_range: [-1, 5], y_range: [-1, 5]})
    const renderer = p.patches({xs: {expr: xs}, ys: {expr: ys}, source: cells, fill_color: "red"})
    const {view} = await display(p)
    const image = () => view.canvas_view.primary.canvas.toDataURL()
    const check = async (update: () => void) => {
      const before = image()
      update()
      await view.ready
      expect(image() != before).to.be.true
    }
    await check(() => values.data = {x: [1, 2, 1], y: [1, 1, 2]})
    await check(() => values.patch({x: [[1, 3]]}))
    values.stream({x: [3], y: [3]})
    await view.ready
    await check(() => cells.stream({vertices: [[1, 2, 3]]}))
    await check(() => cells.patch({vertices: [[0, [0, 2, 3]]]}))
    await check(() => cells.data = {vertices: [[0, 1, 2]]})
    const replacement = ColumnDataSource.create({data: {x: [2, 3, 2], y: [2, 2, 3]}})
    await check(() => { xs.source = replacement })
    await check(() => replacement.patch({x: [[1, 4]]}))
    const other_cells = ColumnDataSource.create({data: {vertices: [[0, 1, 1]]}})
    await check(() => { renderer.data_source = other_cells })
    await check(() => other_cells.patch({vertices: [[0, [0, 1, 2]]]}))
    await check(() => other_cells.data = {vertices: [[0, 1, 1]]})
    await check(() => other_cells.data = {
      vertices: ndarray(new Int32Array([0, 1, 2]), {shape: [1, 3]}),
    })
    await check(() => replacement.stream({x: [0]}, 3))
  })
})

describe("IndexedLookup shared MultiLine coordinates", () => {
  it("renders and updates one coordinate row shared by multiple lines", async () => {
    const coordinates = ColumnDataSource.create({data: {x: [[1, 2, 3]]}})
    const lines = ColumnDataSource.create({data: {row: [0, 0], ys: [[1, 2, 1], [3, 2, 3]]}})
    const xs = IndexedLookup.create({source: coordinates, field: "x", indices: "row"})
    const p = fig([200, 200], {x_range: [0, 5], y_range: [0, 4]})
    p.multi_line({xs: {expr: xs}, ys: {field: "ys"}, source: lines})
    const {view} = await display(p)
    const image = () => view.canvas_view.primary.canvas.toDataURL()
    const before = image()
    coordinates.patch({x: [[0, [2, 3, 4]]]})
    await view.ready
    expect(image() != before).to.be.true
    expect(xs.v_compute(lines)).to.be.equal([[2, 3, 4], [2, 3, 4]])
  })
})

describe("IndexedLookup renderer source replacement", () => {
  it("updates once with current CDSView indices after replacing the view", async () => {
    const values = ColumnDataSource.create({data: {x: [0, 1, 0], y: [0, 0, 1]}})
    const cells = ColumnDataSource.create({data: {vertices: [[0, 1, 2], [2, 1, 0]]}})
    const xs = IndexedLookup.create({source: values, field: "x", indices: "vertices"})
    const ys = IndexedLookup.create({source: values, field: "y", indices: "vertices"})
    const p = fig([200, 200], {x_range: [-1, 2], y_range: [-1, 2]})
    const renderer = p.patches({xs: {expr: xs}, ys: {expr: ys}, source: cells})
    const {view} = await display(p)
    const renderer_view = view.owner.get_one(renderer)
    const glyph = renderer_view.glyph as PatchesView
    using spy = restorable(sinon.spy(renderer_view, "set_data"))

    const replace_source = async (indices: number[][]) => {
      spy.resetHistory()
      renderer.data_source = ColumnDataSource.create({data: {vertices: indices}})
      await view.ready
      expect(spy.callCount).to.be.equal(1)
      expect(renderer.view.indices.size).to.be.equal(indices.length)
      expect(glyph.data_size).to.be.equal(renderer.view.indices.count)
      expect(Array.from({length: glyph.data_size}, (_, i) => Array.from(glyph.xs.get(i))))
        .to.be.equal(indices.filter((_, i) => renderer.view.indices.get(i)).map((row) => row.map((i) => values.get<number>("x")[i])))
    }

    await replace_source([[0, 1, 2]])
    renderer.view = CDSView.create()
    await view.ready
    await replace_source([[0, 1, 2], [2, 1, 0]])
    await replace_source([[2, 1, 0]])
    await replace_source([[0, 2, 1]])

    renderer.view = CDSView.create({filter: IndexFilter.create({indices: [0]})})
    await view.ready
    await replace_source([[2, 1, 0], [0, 1, 2]])
    renderer.view.filter = IndexFilter.create({indices: [1]})
    await view.ready
    expect(glyph.data_size).to.be.equal(1)
    expect(Array.from(glyph.xs.get(0))).to.be.equal([0, 1, 0])
    await replace_source([[0, 2, 1], [1, 0, 2]])
    renderer.setv({
      view: CDSView.create(),
      data_source: ColumnDataSource.create({data: {vertices: [[1, 2, 0]]}}),
    })
    await view.ready
    expect(glyph.data_size).to.be.equal(1)
    expect(Array.from(glyph.xs.get(0))).to.be.equal([1, 0, 0])
    renderer.data_source.stream({vertices: [[0, 1, 2]]})
    await view.ready
    expect(glyph.data_size).to.be.equal(2)
    expect(Array.from(glyph.xs.get(1))).to.be.equal([0, 1, 0])
  })
})

describe("IndexedLookup replacement lifecycle", () => {
  const make_plot = async (hover: boolean = false) => {
    const values = ColumnDataSource.create({data: {x: [0, 1, 1, 0, 0.5], y: [0, 0, 1, 1, 0.5]}})
    const cells = ColumnDataSource.create({data: {vertices: [[0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]]}})
    const xs = IndexedLookup.create({source: values, field: "x", indices: "vertices"})
    const ys = IndexedLookup.create({source: values, field: "y", indices: "vertices"})
    const p = fig([200, 200], {x_range: [-1, 2], y_range: [-1, 2]})
    const renderer = p.patches({xs: {expr: xs}, ys: {expr: ys}, source: cells})
    if (hover) {
      renderer.hover_glyph = Patches.create({xs: {expr: xs}, ys: {expr: ys}, fill_color: "red"})
    }
    const {view} = await display(p)
    const renderer_view = view.owner.get_one(renderer)
    const glyph = renderer_view.glyph as PatchesView
    return {p, view, renderer, renderer_view, glyph}
  }

  for (const length of [2, 4]) {
    for (const kind of ["patch", "replace", "stream"] as const) {
      it(`renders a same-tick ${kind} after replacing the source with ${length} rows`, async () => {
        const {view, renderer, glyph} = await make_plot()
        const rows = Array.from({length}, () => [0, 1, 4])
        const source = ColumnDataSource.create({data: {vertices: rows}})
        renderer.data_source = source
        if (kind == "patch") {
          source.patch({vertices: [[0, [2, 3, 4]]]})
        } else if (kind == "replace") {
          source.data = {vertices: rows.map((row, i) => i == 0 ? [2, 3, 4] : row)}
        } else {
          source.stream({vertices: [[2, 3, 4]]})
        }
        await view.ready
        expect(glyph.data_size).to.be.equal(kind == "stream" ? length + 1 : length)
        const changed = kind == "stream" ? length : 0
        expect(Array.from(glyph.xs.get(changed))).to.be.equal([1, 0, 0.5])
      })
    }
  }

  it("supports data_source before view in a combined update", async () => {
    const {view, renderer, glyph} = await make_plot()
    renderer.setv({
      data_source: ColumnDataSource.create({data: {vertices: [[2, 3, 4]]}}),
      view: CDSView.create(),
    })
    await view.ready
    expect(Array.from(glyph.xs.get(0))).to.be.equal([1, 0, 0.5])
    renderer.data_source.stream({vertices: [[3, 0, 4]]})
    await view.ready
    expect(glyph.data_size).to.be.equal(2)
    expect(Array.from(glyph.xs.get(1))).to.be.equal([0, 0, 0.5])
  })

  for (const replace of ["source", "view", "both"] as const) {
    it(`disconnects removed renderers during ${replace} replacement`, async () => {
      const {p, view, renderer, renderer_view} = await make_plot()
      using data_spy = restorable(sinon.spy(renderer_view, "set_data"))
      using indices_spy = restorable(sinon.spy(CDSViewView.prototype, "compute_indices"))
      const source = ColumnDataSource.create({data: {vertices: [[2, 3, 4]]}})
      if (replace != "view") {
        renderer.data_source = source
      }
      if (replace != "source") {
        renderer.view = CDSView.create()
      }
      const active_source = renderer.data_source
      p.renderers = []
      await view.ready
      await defer()
      expect(renderer_view.is_destroyed).to.be.true
      data_spy.resetHistory()
      indices_spy.resetHistory()
      active_source.patch({vertices: [[0, [3, 0, 4]]]})
      await defer()
      expect(data_spy.callCount).to.be.equal(0)
      expect(indices_spy.callCount).to.be.equal(0)
    })
  }

  it("moves hover inspection subscriptions to the replacement source", async () => {
    const {view, renderer, renderer_view} = await make_plot(true)
    const old_source = renderer.data_source
    const source = ColumnDataSource.create({data: {vertices: [[0, 1, 4], [2, 3, 4]]}})
    renderer.data_source = source
    await view.ready
    using spy = restorable(sinon.spy(renderer_view, "request_paint"))
    old_source.inspect.emit([renderer, {geometry: {type: "point", sx: 0, sy: 0}}])
    await view.ready
    expect(spy.callCount).to.be.equal(0)
    source.inspected.indices = [0]
    const before = view.canvas_view.primary.canvas.toDataURL()
    source.inspect.emit([renderer, {geometry: {type: "point", sx: 0, sy: 0}}])
    await view.ready
    expect(spy.callCount).to.be.equal(1)
    expect(view.canvas_view.primary.canvas.toDataURL() != before).to.be.true
  })

  it("coalesces rapid source replacements and keeps the final source subscribed", async () => {
    const {view, renderer, renderer_view, glyph} = await make_plot()
    using spy = restorable(sinon.spy(renderer_view, "set_data"))
    const first = ColumnDataSource.create({data: {vertices: [[0, 1, 4]]}})
    const last = ColumnDataSource.create({data: {vertices: [[0, 1, 4], [1, 2, 4]]}})
    renderer.data_source = first
    renderer.data_source = last
    last.patch({vertices: [[0, [2, 3, 4]]]})
    await view.ready
    expect(spy.callCount).to.be.equal(1)
    expect(Array.from(glyph.xs.get(0))).to.be.equal([1, 0, 0.5])
    spy.resetHistory()
    first.patch({vertices: [[0, [3, 0, 4]]]})
    await view.ready
    expect(spy.callCount).to.be.equal(0)
    last.patch({vertices: [[0, [3, 0, 4]]]})
    await view.ready
    expect(spy.callCount).to.be.equal(1)
    expect(Array.from(glyph.xs.get(0))).to.be.equal([0, 0, 0.5])
  })

  it("disposes superseded builds when view replacement returns to the same model", async () => {
    const {view, renderer, glyph} = await make_plot()
    const first = CDSView.create()
    renderer.view = first
    renderer.view = CDSView.create()
    renderer.view = first
    await view.ready
    using spy = restorable(sinon.spy(CDSViewView.prototype, "compute_indices"))
    renderer.data_source.patch({vertices: [[0, [2, 3, 4]]]})
    await view.ready
    expect(spy.callCount).to.be.equal(1)
    expect(Array.from(glyph.xs.get(0))).to.be.equal([1, 0, 0.5])
  })

  it("streams when patches use the same source for coordinates and indices", async () => {
    const source = ColumnDataSource.create({data: {
      x: [0, 1, 0], y: [0, 0, 1], vertices: [[0, 1, 2], [1, 2, 0], [2, 0, 1]],
    }})
    const p = fig([200, 200], {x_range: [-1, 3], y_range: [-1, 3]})
    const renderer = p.patches({
      xs: {expr: IndexedLookup.create({source, field: "x", indices: "vertices"})},
      ys: {expr: IndexedLookup.create({source, field: "y", indices: "vertices"})},
      source,
    })
    const {view} = await display(p)
    const glyph = view.owner.get_one(renderer).glyph as PatchesView
    source.stream({x: [2], y: [2], vertices: [[0, 1, 3]]})
    await view.ready
    expect(glyph.data_size).to.be.equal(4)
    expect(Array.from(glyph.xs.get(3))).to.be.equal([0, 1, 2])
  })

})
