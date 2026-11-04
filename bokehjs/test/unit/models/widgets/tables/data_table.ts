import {display, column} from "#framework/layouts"
import {spy} from "sinon"
import {TableColumn} from "@bokehjs/models/widgets/tables/table_column"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {expect} from "#framework/assertions"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {IndexedView} from "@bokehjs/models/sources/indexed_view"

import {TableDataProvider, DataTable} from "@bokehjs/models/widgets/tables/data_table"
import {DTINDEX_NAME} from "@bokehjs/models/widgets/tables/definitions"

import {range} from "@bokehjs/core/util/array"

import {build} from "../../sources/indexed_view"

describe("data_table module", () => {

  it("should define DTINDEX_NAME", () => {
    expect(DTINDEX_NAME).to.be.equal("__bkdt_internal_index__")
  })

  it("reconnects replacement views, sources and selections and disposes obsolete views", async () => {
    const old_source = ColumnDataSource.create({data: {x: [1, 2, 3]}})
    const old_view = IndexedView.create({filter: IndexFilter.create({indices: [0, 2]})})
    const table = DataTable.create({
      source: old_source, view: old_view, columns: [TableColumn.create({field: "x"})], width: 300, height: 200,
    })
    const {view} = await display(table)
    const old_child = view.owner.get_one(old_view)
    const old_column = view.owner.get_one(table.columns[0])
    const state = view as unknown as {data: TableDataProvider, grid: {getSelectedRows(): number[]}}
    expect(state.data.index).to.be.equal([0, 2])
    const current = IndexedView.create({filter: IndexFilter.create({indices: [1]})})
    table.setv({view: current, columns: [TableColumn.create({field: "x"})]})
    await view.ready
    expect(old_child.is_destroyed).to.be.true
    expect(old_column.is_destroyed).to.be.true
    expect(state.data.index).to.be.equal([1])
    const replacement = ColumnDataSource.create({data: {x: [10, 20, 30]}})
    table.source = replacement
    replacement.patch({x: [[1, 25]]})
    replacement.selected.indices = [1]
    await view.ready
    expect(state.data.getField(0, "x")).to.be.equal(25)
    expect(state.grid.getSelectedRows()).to.be.equal([0])
    const update = spy(view, "updateGrid")
    const select = spy(view, "updateSelection")
    try {
      old_source.stream({x: [4]})
      old_source.selected.indices = [0]
      old_view.filter = IndexFilter.create({indices: [0]})
      await view.ready
      expect(update.callCount).to.be.equal(0)
      expect(select.callCount).to.be.equal(0)
      current.filter = IndexFilter.create({indices: [0, 2]})
      await view.ready
      expect(state.data.index).to.be.equal([0, 2])
      expect(state.data.getField(1, "x")).to.be.equal(30)
    } finally {
      update.restore()
      select.restore()
    }
  })

  it("cancels pending table data and column view replacements when the table is removed", async () => {
    const source = ColumnDataSource.create({data: {x: [1, 2, 3]}})
    const table = DataTable.create({source, columns: [TableColumn.create({field: "x"})], width: 300, height: 200})
    const layout = column([table])
    const {view} = await display(layout)
    const table_view = view.owner.get_one(table)
    const rerender = spy(table_view, "rerender")
    table.setv({view: IndexedView.create({filter: IndexFilter.create({indices: [1]})}), columns: [TableColumn.create({field: "x"})]})
    layout.children = []
    await view.ready
    expect(table_view.is_destroyed).to.be.true
    expect(rerender.callCount).to.be.equal(0)
    rerender.restore()
    const update = spy(table_view, "updateGrid")
    try {
      source.stream({x: [4]})
      table.view.filter = IndexFilter.create({indices: [0]})
      await view.ready
      expect(update.callCount).to.be.equal(0)
      expect(table_view._children_views().filter((child) => child?.model instanceof IndexedView).length).to.be.equal(0)
    } finally {
      update.restore()
    }
  })

  describe("DataTable class", () => {

    describe("get_scroll_index method", () => {

      it("should return null when scroll_to_selection=false", () => {
        const t = DataTable.create({scroll_to_selection: false})
        expect(t.get_scroll_index({top: 0, bottom: 16}, [])).to.be.null
        expect(t.get_scroll_index({top: 0, bottom: 16}, [10])).to.be.null
        expect(t.get_scroll_index({top: 0, bottom: 16}, [18])).to.be.null
      })

      it("should return null when scroll_to_selection=true but selection is empty", () => {
        const t = DataTable.create({scroll_to_selection: true})
        expect(t.get_scroll_index({top: 0, bottom: 16}, [])).to.be.null
      })

      it("should return null when scroll_to_selection=true but any selection is already in range", () => {
        const t = DataTable.create({scroll_to_selection: true})
        expect(t.get_scroll_index({top: 0, bottom: 16}, [2])).to.be.null
        expect(t.get_scroll_index({top: 5, bottom: 16}, [2, 10])).to.be.null
        expect(t.get_scroll_index({top: 5, bottom: 16}, [2, 10, 18])).to.be.null
      })

      it("should return (min-1) when scroll_to_selection=true but no selection is in range", () => {
        const t = DataTable.create({scroll_to_selection: true})
        expect(t.get_scroll_index({top: 5, bottom: 16}, [2])).to.be.equal(1)
        expect(t.get_scroll_index({top: 5, bottom: 16}, [2, 18])).to.be.equal(1)
        expect(t.get_scroll_index({top: 5, bottom: 16}, [18])).to.be.equal(17)
      })
    })
  })

  describe("DataProvider class", () => {

    it("should raise an error if DTINDEX_NAME is in source", async () => {
      const bad = ColumnDataSource.create({data: {__bkdt_internal_index__: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = IndexedView.create()
      await build(view, bad)
      expect(() => new TableDataProvider(bad, view)).to.throw()
    })

    it("should construct an internal index", async () => {
      const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = IndexedView.create()
      await build(view, source)
      const dp = new TableDataProvider(source, view)
      expect(dp.index).to.be.equal([0, 1, 2, 3])
    })

    it("should report the data source length", async () => {
      const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = IndexedView.create()
      await build(view, source)
      const dp = new TableDataProvider(source, view)
      expect(dp.getLength()).to.be.equal(4)
    })

    it("should return items when unsorted", async () => {
      const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = IndexedView.create()
      await build(view, source)
      const dp = new TableDataProvider(source, view)

      expect(dp.getItems()).to.be.equal([
        {__bkdt_internal_index__: 0, index: 0,  bar: 3.4},
        {__bkdt_internal_index__: 1, index: 1,  bar: 1.2},
        {__bkdt_internal_index__: 2, index: 2,  bar: 0},
        {__bkdt_internal_index__: 3, index: 10, bar: -10},
      ])
    })

    it("should return all items when unsorted", async () => {
      const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = IndexedView.create()
      await build(view, source)
      const dp = new TableDataProvider(source, view)

      expect(dp.getItems()).to.be.equal([
        {__bkdt_internal_index__: 0, index: 0,  bar: 3.4},
        {__bkdt_internal_index__: 1, index: 1,  bar: 1.2},
        {__bkdt_internal_index__: 2, index: 2,  bar: 0},
        {__bkdt_internal_index__: 3, index: 10, bar: -10},
      ])
    })

    it("should return items when sorted", async () => {
      const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = IndexedView.create()
      await build(view, source)
      const dp = new TableDataProvider(source, view)
      const fake_col = {columnId: "bar", sortAsc: true, sortCol: {id: "bar", field: "bar"}}
      dp.sort_data([fake_col])

      expect(dp.getItems()).to.be.equal([
        {__bkdt_internal_index__: 3, index: 10, bar: -10},
        {__bkdt_internal_index__: 2, index: 2,  bar: 0},
        {__bkdt_internal_index__: 1, index: 1,  bar: 1.2},
        {__bkdt_internal_index__: 0, index: 0,  bar: 3.4},
      ])
    })

    it("should return fields when unsorted", async () => {
      const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = IndexedView.create()
      await build(view, source)
      const dp = new TableDataProvider(source, view)

      expect(dp.getField(0, "index")).to.be.equal(0)
      expect(dp.getField(1, "index")).to.be.equal(1)
      expect(dp.getField(2, "index")).to.be.equal(2)
      expect(dp.getField(3, "index")).to.be.equal(10)

      expect(dp.getField(0, "bar")).to.be.equal(3.4)
      expect(dp.getField(1, "bar")).to.be.equal(1.2)
      expect(dp.getField(2, "bar")).to.be.equal(0)
      expect(dp.getField(3, "bar")).to.be.equal(-10)

      expect(dp.getField(0, DTINDEX_NAME)).to.be.equal(0)
      expect(dp.getField(1, DTINDEX_NAME)).to.be.equal(1)
      expect(dp.getField(2, DTINDEX_NAME)).to.be.equal(2)
      expect(dp.getField(3, DTINDEX_NAME)).to.be.equal(3)
    })

    it("should return fields when sorted", async () => {
      const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = IndexedView.create()
      await build(view, source)
      const dp = new TableDataProvider(source, view)

      const fake_col = {columnId: "bar", sortAsc: true, sortCol: {id: "bar", field: "bar"}}
      dp.sort_data([fake_col])

      expect(dp.getField(0, "index")).to.be.equal(10)
      expect(dp.getField(1, "index")).to.be.equal(2)
      expect(dp.getField(2, "index")).to.be.equal(1)
      expect(dp.getField(3, "index")).to.be.equal(0)

      expect(dp.getField(0, "bar")).to.be.equal(-10)
      expect(dp.getField(1, "bar")).to.be.equal(0)
      expect(dp.getField(2, "bar")).to.be.equal(1.2)
      expect(dp.getField(3, "bar")).to.be.equal(3.4)

      expect(dp.getField(0, DTINDEX_NAME)).to.be.equal(3)
      expect(dp.getField(1, DTINDEX_NAME)).to.be.equal(2)
      expect(dp.getField(2, DTINDEX_NAME)).to.be.equal(1)
      expect(dp.getField(3, DTINDEX_NAME)).to.be.equal(0)
    })

    it("should get all records", async () => {
      const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = IndexedView.create()
      await build(view, source)
      const dp = new TableDataProvider(source, view)
      expect(dp.getRecords()).to.be.equal(range(0, dp.getLength()).map((i) => dp.getItem(i)))

      const fake_col = {columnId: "bar", sortAsc: true, sortCol: {id: "bar", field: "bar"}}
      dp.sort_data([fake_col])
      expect(dp.getRecords()).to.be.equal(range(0, dp.getLength()).map((i) => dp.getItem(i)))
    })

    it("should re-order only the index when sorted", async () => {
      const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = IndexedView.create()
      await build(view, source)
      const dp = new TableDataProvider(source, view)
      expect(dp.index).to.be.equal([0, 1, 2, 3])

      const fake_col = {columnId: "bar", sortAsc: true, sortCol: {id: "bar", field: "bar"}}
      dp.sort_data([fake_col])
      expect(dp.index).to.be.equal([3, 2, 1, 0])
      expect(dp.source.data).to.be.equal({index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]})
    })

    it("should set fields when unsorted", async () => {
      const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = IndexedView.create()
      await build(view, source)
      const dp = new TableDataProvider(source, view)

      dp.setField(0, "index", 10.1)
      expect(dp.source.data).to.be.equal({index: [10.1, 1, 2, 10], bar: [3.4, 1.2, 0, -10]})

      dp.setField(2, "bar", 100)
      expect(dp.source.data).to.be.equal({index: [10.1, 1, 2, 10], bar: [3.4, 1.2, 100, -10]})
    })

    it("should set fields when sorted", async () => {
      const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = IndexedView.create()
      await build(view, source)
      const dp = new TableDataProvider(source, view)
      const fake_col = {columnId: "bar", sortAsc: true, sortCol: {id: "bar", field: "bar"}}
      dp.sort_data([fake_col])

      dp.setField(0, "index", 10.1)
      expect(dp.source.data).to.be.equal({index: [0, 1, 2, 10.1], bar: [3.4, 1.2, 0, -10]})

      dp.setField(2, "bar", 100)
      expect(dp.source.data).to.be.equal({index: [0, 1, 2, 10.1], bar: [3.4, 100, 0, -10]})
    })

    it("should support sorting NaNs and infinities", async () => {
      const source = ColumnDataSource.create({data: {
        index: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
        col0: [3.4, -Infinity, NaN, 1.21, 1.2, -Infinity, Infinity, 0, NaN, -10],
      }})
      const view = IndexedView.create()
      await build(view, source)
      const dp = new TableDataProvider(source, view)

      expect(dp.getItems()).to.be.equal([
        {__bkdt_internal_index__: 0, index: "A", col0: 3.4},
        {__bkdt_internal_index__: 1, index: "B", col0: -Infinity},
        {__bkdt_internal_index__: 2, index: "C", col0: NaN},
        {__bkdt_internal_index__: 3, index: "D", col0: 1.21},
        {__bkdt_internal_index__: 4, index: "E", col0: 1.2},
        {__bkdt_internal_index__: 5, index: "F", col0: -Infinity},
        {__bkdt_internal_index__: 6, index: "G", col0: Infinity},
        {__bkdt_internal_index__: 7, index: "H", col0: 0},
        {__bkdt_internal_index__: 8, index: "I", col0: NaN},
        {__bkdt_internal_index__: 9, index: "J", col0: -10},
      ])

      dp.sort_data([{columnId: "col0", sortCol: {id: "col0", field: "col0"}, sortAsc: true}])

      expect(dp.getItems()).to.be.equal([
        {__bkdt_internal_index__: 1, index: "B", col0: -Infinity},
        {__bkdt_internal_index__: 5, index: "F", col0: -Infinity},
        {__bkdt_internal_index__: 9, index: "J", col0: -10},
        {__bkdt_internal_index__: 7, index: "H", col0: 0},
        {__bkdt_internal_index__: 4, index: "E", col0: 1.2},
        {__bkdt_internal_index__: 3, index: "D", col0: 1.21},
        {__bkdt_internal_index__: 0, index: "A", col0: 3.4},
        {__bkdt_internal_index__: 6, index: "G", col0: Infinity},
        {__bkdt_internal_index__: 2, index: "C", col0: NaN},
        {__bkdt_internal_index__: 8, index: "I", col0: NaN},
      ])

      dp.sort_data([{columnId: "col0", sortCol: {id: "col0", field: "col0"}, sortAsc: false}])

      expect(dp.getItems()).to.be.equal([
        {__bkdt_internal_index__: 2, index: "C", col0: NaN},
        {__bkdt_internal_index__: 8, index: "I", col0: NaN},
        {__bkdt_internal_index__: 6, index: "G", col0: Infinity},
        {__bkdt_internal_index__: 0, index: "A", col0: 3.4},
        {__bkdt_internal_index__: 3, index: "D", col0: 1.21},
        {__bkdt_internal_index__: 4, index: "E", col0: 1.2},
        {__bkdt_internal_index__: 7, index: "H", col0: 0},
        {__bkdt_internal_index__: 9, index: "J", col0: -10},
        {__bkdt_internal_index__: 1, index: "B", col0: -Infinity},
        {__bkdt_internal_index__: 5, index: "F", col0: -Infinity},
      ])
    })
  })
})
