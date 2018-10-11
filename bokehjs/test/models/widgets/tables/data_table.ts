import {expect} from "chai"

import {ColumnDataSource} from "models/sources/column_data_source"
import {CDSView} from "models/sources/cds_view"

import {DataProvider, DataTable, DTINDEX_NAME} from "models/widgets/tables/data_table"

import {range} from "core/util/array"

describe("data_table module", () => {

  it("should define DTINDEX_NAME", () => {
    expect(DTINDEX_NAME).to.equal("__bkdt_internal_index__")
  })

  describe("DataTable class", () => {

    describe("get_scroll_index method", () => {

      it("should return null when scroll_to_selection=false", () => {
        const t = new DataTable({scroll_to_selection: false})
        expect(t.get_scroll_index({top: 0, bottom: 16}, [])).to.be.null
        expect(t.get_scroll_index({top: 0, bottom: 16}, [10])).to.be.null
        expect(t.get_scroll_index({top: 0, bottom: 16}, [18])).to.be.null
      })

      it("should return null when scroll_to_selection=true but selection is empty", () => {
        const t = new DataTable({scroll_to_selection: true})
        expect(t.get_scroll_index({top: 0, bottom: 16}, [])).to.be.null
      })

      it("should return null when scroll_to_selection=true but any selection is already in range", () => {
        const t = new DataTable({scroll_to_selection: true})
        expect(t.get_scroll_index({top: 0, bottom: 16}, [2])).to.be.null
        expect(t.get_scroll_index({top: 5, bottom: 16}, [2, 10])).to.be.null
        expect(t.get_scroll_index({top: 5, bottom: 16}, [2, 10, 18])).to.be.null
      })

      it("should return (min-1) when scroll_to_selection=true but no selection is in range", () => {
        const t = new DataTable({scroll_to_selection: true})
        expect(t.get_scroll_index({top: 5, bottom: 16}, [2])).to.be.equal(1)
        expect(t.get_scroll_index({top: 5, bottom: 16}, [2, 18])).to.be.equal(1)
        expect(t.get_scroll_index({top: 5, bottom: 16}, [18])).to.be.equal(17)
      })
    })
  })

  describe("DataProvider class", () => {

    it("should raise an error if DTINDEX_NAME is in source", () => {
      const bad = new ColumnDataSource({data: {__bkdt_internal_index__: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      const view = new CDSView({source: bad})
      expect(() => new DataProvider(bad, view)).to.throw(Error)
    })

    it("should construct an internal index", () => {
      const source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      const view = new CDSView({source})
      const dp = new DataProvider(source, view)
      expect(dp.index).to.deep.equal([0,1,2,3])
    })

    it("should report the data source length", () => {
      const source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      const view = new CDSView({source})
      const dp = new DataProvider(source, view)
      expect(dp.getLength()).to.equal(4)
    })

    it("should return items when unsorted", () => {
      const source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      const view = new CDSView({source})
      const dp = new DataProvider(source, view)

      expect(dp.getItem(0)).to.deep.equal({__bkdt_internal_index__: 0, index: 0,  bar: 3.4})
      expect(dp.getItem(1)).to.deep.equal({__bkdt_internal_index__: 1, index: 1,  bar: 1.2})
      expect(dp.getItem(2)).to.deep.equal({__bkdt_internal_index__: 2, index: 2,  bar: 0})
      expect(dp.getItem(3)).to.deep.equal({__bkdt_internal_index__: 3, index: 10, bar: -10})
    })

    it("should return items when sorted", () => {
      const source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      const view = new CDSView({source})
      const dp = new DataProvider(source, view)
      const fake_col = {sortAsc: true, sortCol: {field: "bar"}}
      dp.sort([fake_col])

      expect(dp.getItem(0)).to.deep.equal({__bkdt_internal_index__: 3, index: 10, bar: -10})
      expect(dp.getItem(1)).to.deep.equal({__bkdt_internal_index__: 2, index: 2,  bar: 0})
      expect(dp.getItem(2)).to.deep.equal({__bkdt_internal_index__: 1, index: 1,  bar: 1.2})
      expect(dp.getItem(3)).to.deep.equal({__bkdt_internal_index__: 0, index: 0,  bar: 3.4})
    })

    it("should return fields when unsorted", () => {
      const source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      const view = new CDSView({source})
      const dp = new DataProvider(source, view)

      expect(dp.getField(0, "index")).to.deep.equal(0)
      expect(dp.getField(1, "index")).to.deep.equal(1)
      expect(dp.getField(2, "index")).to.deep.equal(2)
      expect(dp.getField(3, "index")).to.deep.equal(10)

      expect(dp.getField(0, "bar")).to.deep.equal(3.4)
      expect(dp.getField(1, "bar")).to.deep.equal(1.2)
      expect(dp.getField(2, "bar")).to.deep.equal(0)
      expect(dp.getField(3, "bar")).to.deep.equal(-10)

      expect(dp.getField(0, DTINDEX_NAME)).to.deep.equal(0)
      expect(dp.getField(1, DTINDEX_NAME)).to.deep.equal(1)
      expect(dp.getField(2, DTINDEX_NAME)).to.deep.equal(2)
      expect(dp.getField(3, DTINDEX_NAME)).to.deep.equal(3)
    })

    it("should return fields when sorted", () => {
      const source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      const view = new CDSView({source})
      const dp = new DataProvider(source, view)

      const fake_col = {sortAsc: true, sortCol: {field: "bar"}}
      dp.sort([fake_col])

      expect(dp.getField(0, "index")).to.deep.equal(10)
      expect(dp.getField(1, "index")).to.deep.equal(2)
      expect(dp.getField(2, "index")).to.deep.equal(1)
      expect(dp.getField(3, "index")).to.deep.equal(0)

      expect(dp.getField(0, "bar")).to.deep.equal(-10)
      expect(dp.getField(1, "bar")).to.deep.equal(0)
      expect(dp.getField(2, "bar")).to.deep.equal(1.2)
      expect(dp.getField(3, "bar")).to.deep.equal(3.4)

      expect(dp.getField(0, DTINDEX_NAME)).to.deep.equal(3)
      expect(dp.getField(1, DTINDEX_NAME)).to.deep.equal(2)
      expect(dp.getField(2, DTINDEX_NAME)).to.deep.equal(1)
      expect(dp.getField(3, DTINDEX_NAME)).to.deep.equal(0)
    })

    it("should get all records", () => {
      const source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      const view = new CDSView({source})
      const dp = new DataProvider(source, view)
      expect(dp.getRecords()).to.deep.equal(range(0, dp.getLength()).map((i) => dp.getItem(i)))

      const fake_col = {sortAsc: true, sortCol: {field: "bar"}}
      dp.sort([fake_col])
      expect(dp.getRecords()).to.deep.equal(range(0, dp.getLength()).map((i) => dp.getItem(i)))
    })

    it("should re-order only the index when sorted", () => {
      const source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      const view = new CDSView({source})
      const dp = new DataProvider(source, view)
      expect(dp.index).to.deep.equal([0,1,2,3])

      const fake_col = {sortAsc: true, sortCol: {field: "bar"}}
      dp.sort([fake_col])
      expect(dp.index).to.deep.equal([3,2,1,0])
      expect(dp.source.data).to.deep.equal({index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]})
    })

    it("should return null metadata", () => {
      const source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      const view = new CDSView({source})
      const dp = new DataProvider(source, view)
      expect(dp.getItemMetadata(0)).to.be.null
    })

    it("should set fields when unsorted", () => {
      const source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      const view = new CDSView({source})
      const dp = new DataProvider(source, view)

      dp.setField(0, "index", 10.1)
      expect(dp.source.data).to.deep.equal({index: [10.1,1,2,10], bar: [3.4, 1.2, 0, -10]})

      dp.setField(2, "bar", 100)
      expect(dp.source.data).to.deep.equal({index: [10.1,1,2,10], bar: [3.4, 1.2, 100, -10]})
    })

    it("should set fields when sorted", () => {
      const source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      const view = new CDSView({source})
      const dp = new DataProvider(source, view)
      const fake_col = {sortAsc: true, sortCol: {field: "bar"}}
      dp.sort([fake_col])

      dp.setField(0, "index", 10.1)
      expect(dp.source.data).to.deep.equal({index: [0,1,2,10.1], bar: [3.4, 1.2, 0, -10]})

      dp.setField(2, "bar", 100)
      expect(dp.source.data).to.deep.equal({index: [0,1,2,10.1], bar: [3.4, 100, 0, -10]})
    })

  })
})
