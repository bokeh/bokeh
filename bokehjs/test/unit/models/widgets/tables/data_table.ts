import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {CDSView} from "@bokehjs/models/sources/cds_view"

import {TableDataProvider, DataTable, DataTableView} from "@bokehjs/models/widgets/tables/data_table"
import {TableColumn} from "@bokehjs/models/widgets/tables/table_column"
import {StringFormatter} from "@bokehjs/models/widgets/tables/cell_formatters"
import {SelectEditor} from "@bokehjs/models/widgets/tables/cell_editors"
import {LinearColorMapper} from "@bokehjs/models/mappers/linear_color_mapper"
import {CustomJS} from "@bokehjs/models/callbacks/customjs"
import {CustomJSCompare} from "@bokehjs/models/comparisons/customjs_compare"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {HTML} from "@bokehjs/models/dom/html"
import {DTINDEX_NAME} from "@bokehjs/models/widgets/tables/definitions"
import type {ColumnType} from "@bokehjs/models/widgets/tables/definitions"

import {range} from "@bokehjs/core/util/array"

import {build} from "../../sources/cds_view"

class UpdatingDataTableView extends DataTableView {
  renders = 0
  updates = 0
  selections = 0

  get slickgrid() {
    return this.grid
  }

  get records() {
    return this.data.getRecords()
  }

  protected override _render_table(): void {
    this.renders++
    super._render_table()
  }

  override updateGrid(): void {
    this.updates++
    super.updateGrid()
  }

  override updateSelection(): void {
    this.selections++
    super.updateSelection()
  }

  sort_descending(): void {
    const column = this.grid.getColumns()[0]
    this.grid.setSortColumns([{columnId: column.id, sortAsc: false}])
    this.grid.onSort.notify({
      grid: this.grid, multiColumnSort: true,
      sortCols: [{columnId: column.id, sortCol: column, sortAsc: false}],
    })
  }
}

class UpdatingDataTable extends DataTable {
  declare __view_type__: UpdatingDataTableView

  static {
    this.prototype.default_view = UpdatingDataTableView
  }
}

describe("DataTableView updates", () => {
  for (const reference of ["none", "callback", "sorter"] as const) {
    it(`should update data and selection without rebuilding or losing sorting with ${reference} source references`, async () => {
      const source = ColumnDataSource.create({data: {x: [2, 1, 3]}})
      const column = TableColumn.create({field: "x"})
      if (reference === "callback") {
        column.js_property_callbacks = {"change:width": [CustomJS.create({args: {source}, code: "void source.data"})]}
      } else if (reference === "sorter") {
        column.sorter = CustomJSCompare.create({args: {source}, code: "return x < y ? -1 : x > y ? 1 : 0"})
      }
      const table = UpdatingDataTable.create({source, columns: [column], index_position: null, width: 400, height: 200})
      const {view} = await display(table)
      const grid = view.slickgrid
      view.sort_descending()
      const sorting = grid.getSortColumns()

      const check = async (update: () => void, values: number[], updates: number) => {
        view.renders = view.updates = view.selections = 0
        update()
        await view.ready
        expect(view.slickgrid).to.be.identical(grid)
        expect(view.renders).to.be.equal(0)
        expect(view.updates).to.be.equal(updates)
        expect(view.selections).to.be.equal(1)
        expect(grid.getSortColumns()).to.be.equal(sorting)
        expect(view.records.map((row) => row.x)).to.be.equal(values)
      }
      await check(() => source.data = {x: [4, 6, 5]}, [6, 5, 4], 1)
      await check(() => source.stream({x: [7]}), [7, 6, 5, 4], 1)
      await check(() => source.patch({x: [[0, 8]]}), [8, 7, 6, 5], 1)
      await check(() => source.selected.indices = [0, 2], [8, 7, 6, 5], 0)
      expect(grid.getSelectedRows()).to.be.equal([0, 3])
      await check(() => {
        source.get_array<number>("x")[1] = 9
        source.change.emit()
      }, [9, 8, 7, 5], 1)
    })
  }

  it("should preserve sorting and update cells when formatters or their properties change", async () => {
    const source = ColumnDataSource.create({data: {x: [2, 1, 3]}})
    const formatter = StringFormatter.create()
    const column = TableColumn.create({field: "x", formatter})
    const table = UpdatingDataTable.create({source, columns: [column], index_position: null, width: 400, height: 200})
    const {view} = await display(table)
    view.sort_descending()
    const sorting = view.slickgrid.getSortColumns()
    const check = () => {
      expect(view.slickgrid.getSortColumns()).to.be.equal(sorting)
      expect(view.records.map((row) => row.x)).to.be.equal([3, 2, 1])
      const cell = view.shadow_el.querySelector<HTMLElement>(".slick-cell > div")!
      expect(cell.style.fontWeight).to.be.equal("bold")
    }
    view.renders = 0
    formatter.font_style = {value: "bold"}
    await view.ready
    expect(view.renders).to.be.equal(1)
    check()

    const replacement = StringFormatter.create({font_style: {value: "bold"}})
    column.formatter = replacement
    await view.ready
    check()
    view.renders = 0
    formatter.font_style = {value: "italic"}
    await view.ready
    expect(view.renders).to.be.equal(0)
    check()
    replacement.font_style = {value: "italic"}
    await view.ready
    const cell = view.shadow_el.querySelector<HTMLElement>(".slick-cell > div")!
    expect(cell.style.fontStyle).to.be.equal("italic")
  })

  it("should observe added columns and update HTML titles once", async () => {
    const source = ColumnDataSource.create({data: {x: [2, 1, 3]}})
    const first = TableColumn.create({field: "x"})
    const table = UpdatingDataTable.create({source, columns: [first], index_position: null, width: 400, height: 200})
    const {view} = await display(table)
    view.sort_descending()
    const second = TableColumn.create({field: "x", title: "Second"})
    view.renders = 0
    table.columns = [first, second]
    await view.ready
    expect(view.renders).to.be.equal(1)
    expect(view.slickgrid.getColumns().length).to.be.equal(2)
    second.visible = false
    await view.ready
    expect(view.slickgrid.getColumns().length).to.be.equal(1)
    second.visible = true
    await view.ready

    view.renders = 0
    const title = HTML.create({html: "<b>Updated title</b>"})
    second.title = title
    await view.ready
    expect(view.renders).to.be.equal(1)
    expect(view.shadow_el.querySelector(".slick-header-columns")!.textContent).to.be.equal("xUpdated title")
    title.html = "<b>Updated again</b>"
    await view.ready
    expect(view.shadow_el.querySelector(".slick-header-columns")!.textContent).to.be.equal("xUpdated again")
    expect(view.slickgrid.getSortColumns()).to.be.equal([{columnId: first.id, sortAsc: false}])
    view.renders = 0
    table.columns = [second]
    await view.ready
    expect(view.slickgrid.getSortColumns()).to.be.equal([])
    view.renders = 0
    first.visible = false
    await view.ready
    expect(view.renders).to.be.equal(0)
  })

  it("should refresh formatter color transforms and their replacements", async () => {
    const source = ColumnDataSource.create({data: {x: [0, 1]}})
    const mapper = LinearColorMapper.create({low: 0, high: 1, palette: ["red", "blue"]})
    const formatter = StringFormatter.create({text_color: {field: "x", transform: mapper}})
    const column = TableColumn.create({field: "x", formatter})
    const table = UpdatingDataTable.create({source, columns: [column], index_position: null, width: 400, height: 200})
    const {view} = await display(table)
    const first_color = () => view.shadow_el.querySelector<HTMLElement>(".slick-cell > div")!.style.color
    expect(first_color()).to.be.equal("rgb(255, 0, 0)")
    mapper.palette = ["green", "blue"]
    await view.ready
    expect(first_color()).to.be.equal("rgb(0, 128, 0)")
    const replacement = LinearColorMapper.create({low: 0, high: 1, palette: ["blue", "red"]})
    formatter.text_color = {field: "x", transform: replacement}
    await view.ready
    expect(first_color()).to.be.equal("rgb(0, 0, 255)")
    view.renders = 0
    mapper.palette = ["red", "green"]
    await view.ready
    expect(view.renders).to.be.equal(0)
    replacement.palette = ["red", "green"]
    await view.ready
    expect(first_color()).to.be.equal("rgb(255, 0, 0)")
  })

  it("should reconnect editors and sorters while retaining the sort column", async () => {
    const source = ColumnDataSource.create({data: {x: [2, 1, 3]}})
    const editor = SelectEditor.create({options: ["1", "2", "3"]})
    const sorter = CustomJSCompare.create({code: "return x < y ? -1 : x > y ? 1 : 0"})
    const column = TableColumn.create({field: "x", editor, sorter})
    const table = UpdatingDataTable.create({source, columns: [column], index_position: null, width: 400, height: 200})
    const {view} = await display(table)
    view.sort_descending()
    editor.options = ["4", "5"]
    await view.ready
    expect((view.slickgrid.getColumns()[0] as ColumnType).model).to.be.identical(editor)
    expect(view.records.map((row) => row.x)).to.be.equal([3, 2, 1])
    const replacement_editor = SelectEditor.create({options: ["6"]})
    column.editor = replacement_editor
    await view.ready
    expect((view.slickgrid.getColumns()[0] as ColumnType).model).to.be.identical(replacement_editor)
    view.renders = 0
    editor.options = ["7"]
    await view.ready
    expect(view.renders).to.be.equal(0)
    sorter.code = "return x < y ? 1 : x > y ? -1 : 0"
    await view.ready
    expect(view.records.map((row) => row.x)).to.be.equal([1, 2, 3])
    const replacement_sorter = CustomJSCompare.create({code: "return x < y ? -1 : x > y ? 1 : 0"})
    column.sorter = replacement_sorter
    await view.ready
    expect(view.records.map((row) => row.x)).to.be.equal([3, 2, 1])
    view.renders = 0
    sorter.code = "return 0"
    await view.ready
    expect(view.renders).to.be.equal(0)
    expect(view.slickgrid.getSortColumns()).to.be.equal([{columnId: column.id, sortAsc: false}])
  })

  it("should update a filtered view while preserving sorting", async () => {
    const source = ColumnDataSource.create({data: {x: [2, 1, 3]}})
    const filter = IndexFilter.create({indices: [0, 1, 2]})
    const table = UpdatingDataTable.create({
      source, view: CDSView.create({filter}), columns: [TableColumn.create({field: "x"})],
      index_position: null, width: 400, height: 200,
    })
    const {view} = await display(table)
    view.sort_descending()
    view.renders = view.updates = 0
    filter.indices = [0, 1]
    await view.ready
    expect(view.renders).to.be.equal(0)
    expect(view.updates).to.be.equal(1)
    expect(view.records.map((row) => row.x)).to.be.equal([2, 1])
  })
})

describe("data_table module", () => {

  it("should define DTINDEX_NAME", () => {
    expect(DTINDEX_NAME).to.be.equal("__bkdt_internal_index__")
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
      const view = CDSView.create()
      await build(view, bad)
      expect(() => new TableDataProvider(bad, view)).to.throw()
    })

    it("should construct an internal index", async () => {
      const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = CDSView.create()
      await build(view, source)
      const dp = new TableDataProvider(source, view)
      expect(dp.index).to.be.equal([0, 1, 2, 3])
    })

    it("should report the data source length", async () => {
      const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = CDSView.create()
      await build(view, source)
      const dp = new TableDataProvider(source, view)
      expect(dp.getLength()).to.be.equal(4)
    })

    it("should return items when unsorted", async () => {
      const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = CDSView.create()
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
      const view = CDSView.create()
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
      const view = CDSView.create()
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
      const view = CDSView.create()
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
      const view = CDSView.create()
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
      const view = CDSView.create()
      await build(view, source)
      const dp = new TableDataProvider(source, view)
      expect(dp.getRecords()).to.be.equal(range(0, dp.getLength()).map((i) => dp.getItem(i)))

      const fake_col = {columnId: "bar", sortAsc: true, sortCol: {id: "bar", field: "bar"}}
      dp.sort_data([fake_col])
      expect(dp.getRecords()).to.be.equal(range(0, dp.getLength()).map((i) => dp.getItem(i)))
    })

    it("should re-order only the index when sorted", async () => {
      const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = CDSView.create()
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
      const view = CDSView.create()
      await build(view, source)
      const dp = new TableDataProvider(source, view)

      dp.setField(0, "index", 10.1)
      expect(dp.source.data).to.be.equal({index: [10.1, 1, 2, 10], bar: [3.4, 1.2, 0, -10]})

      dp.setField(2, "bar", 100)
      expect(dp.source.data).to.be.equal({index: [10.1, 1, 2, 10], bar: [3.4, 1.2, 100, -10]})
    })

    it("should set fields when sorted", async () => {
      const source = ColumnDataSource.create({data: {index: [0, 1, 2, 10], bar: [3.4, 1.2, 0, -10]}})
      const view = CDSView.create()
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
      const view = CDSView.create()
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
