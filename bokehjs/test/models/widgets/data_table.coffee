{expect} = require "chai"
utils = require "../../utils"

{ColumnDataSource} = utils.require("models/sources/column_data_source")

{DataProvider, DataTable, DTINDEX_NAME} = utils.require("models/widgets/data_table")

describe "data_table module", ->

  it "should define DTINDEX_NAME", ->
    expect(DTINDEX_NAME).to.equal "__bkdt_internal_index__"

  describe "DataProvider class", ->

    it "should raise an error if DTINDEX_NAME is in source", ->
      bad = new ColumnDataSource({data: {"__bkdt_internal_index__": [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      expect(() -> new DataProvider(bad)).to.throw Error

    it "should construct an internal index", ->
      source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      dp = new DataProvider(source)
      expect(dp.index).to.deep.equal [0,1,2,3]

    it "should report the data source length", ->
      source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      dp = new DataProvider(source)
      expect(dp.getLength()).to.equal 4

    it "should return items when unsorted", ->
      source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      dp = new DataProvider(source)

      expect(dp.getItem(0)).to.deep.equal {"__bkdt_internal_index__": 0, index:0,  bar: 3.4}
      expect(dp.getItem(1)).to.deep.equal {"__bkdt_internal_index__": 1, index:1,  bar: 1.2}
      expect(dp.getItem(2)).to.deep.equal {"__bkdt_internal_index__": 2, index:2,  bar: 0}
      expect(dp.getItem(3)).to.deep.equal {"__bkdt_internal_index__": 3, index:10, bar: -10}

    it "should return items when sorted", ->
      source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      dp = new DataProvider(source)
      fake_col = {sortAsc: true, sortCol: {field: "bar"}}
      dp.sort([fake_col])

      expect(dp.getItem(0)).to.deep.equal {"__bkdt_internal_index__": 3, index:10, bar: -10}
      expect(dp.getItem(1)).to.deep.equal {"__bkdt_internal_index__": 2, index:2,  bar: 0}
      expect(dp.getItem(2)).to.deep.equal {"__bkdt_internal_index__": 1, index:1,  bar: 1.2}
      expect(dp.getItem(3)).to.deep.equal {"__bkdt_internal_index__": 0, index:0,  bar: 3.4}

    it "should return fields when unsorted", ->
      source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      dp = new DataProvider(source)

      expect(dp.getField(0, "index")).to.deep.equal 0
      expect(dp.getField(1, "index")).to.deep.equal 1
      expect(dp.getField(2, "index")).to.deep.equal 2
      expect(dp.getField(3, "index")).to.deep.equal 10

      expect(dp.getField(0, "bar")).to.deep.equal 3.4
      expect(dp.getField(1, "bar")).to.deep.equal 1.2
      expect(dp.getField(2, "bar")).to.deep.equal 0
      expect(dp.getField(3, "bar")).to.deep.equal -10

      expect(dp.getField(0, DTINDEX_NAME)).to.deep.equal 0
      expect(dp.getField(1, DTINDEX_NAME)).to.deep.equal 1
      expect(dp.getField(2, DTINDEX_NAME)).to.deep.equal 2
      expect(dp.getField(3, DTINDEX_NAME)).to.deep.equal 3

    it "should return fields when sorted", ->
      source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      dp = new DataProvider(source)
      fake_col = {sortAsc: true, sortCol: {field: "bar"}}
      dp.sort([fake_col])

      expect(dp.getField(0, "index")).to.deep.equal 10
      expect(dp.getField(1, "index")).to.deep.equal 2
      expect(dp.getField(2, "index")).to.deep.equal 1
      expect(dp.getField(3, "index")).to.deep.equal 0

      expect(dp.getField(0, "bar")).to.deep.equal -10
      expect(dp.getField(1, "bar")).to.deep.equal 0
      expect(dp.getField(2, "bar")).to.deep.equal 1.2
      expect(dp.getField(3, "bar")).to.deep.equal 3.4

      expect(dp.getField(0, DTINDEX_NAME)).to.deep.equal 3
      expect(dp.getField(1, DTINDEX_NAME)).to.deep.equal 2
      expect(dp.getField(2, DTINDEX_NAME)).to.deep.equal 1
      expect(dp.getField(3, DTINDEX_NAME)).to.deep.equal 0

    it "should get all records", ->
      source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      dp = new DataProvider(source)
      expect(dp.getRecords()).to.deep.equal (dp.getItem(i) for i in [0...dp.getLength()])

      fake_col = {sortAsc: true, sortCol: {field: "bar"}}
      dp.sort([fake_col])
      expect(dp.getRecords()).to.deep.equal (dp.getItem(i) for i in [0...dp.getLength()])

    it "should re-order only the index when sorted", ->
      source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      dp = new DataProvider(source)
      expect(dp.index).to.deep.equal [0,1,2,3]

      fake_col = {sortAsc: true, sortCol: {field: "bar"}}
      dp.sort([fake_col])
      expect(dp.index).to.deep.equal [3,2,1,0]
      expect(dp.source.data).to.deep.equal {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}

    it "should return null metadata", ->
      source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      dp = new DataProvider(source)
      expect(dp.getItemMetadata()).to.be.null

    it "should set fields when unsorted", ->
      source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      dp = new DataProvider(source)

      r = dp.setField(0, "index", 10.1)
      expect(r).to.equal null
      expect(dp.source.data).to.deep.equal {index: [10.1,1,2,10], bar: [3.4, 1.2, 0, -10]}

      r = dp.setField(2, "bar", 100)
      expect(r).to.equal null
      expect(dp.source.data).to.deep.equal {index: [10.1,1,2,10], bar: [3.4, 1.2, 100, -10]}

    it "should set fields when sorted", ->
      source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      dp = new DataProvider(source)
      fake_col = {sortAsc: true, sortCol: {field: "bar"}}
      dp.sort([fake_col])

      r = dp.setField(0, "index", 10.1)
      expect(r).to.equal null
      expect(dp.source.data).to.deep.equal {index: [0,1,2,10.1], bar: [3.4, 1.2, 0, -10]}

      r = dp.setField(2, "bar", 100)
      expect(r).to.equal null
      expect(dp.source.data).to.deep.equal {index: [0,1,2,10.1], bar: [3.4, 100, 0, -10]}

    it "should set items when unsorted", ->
      source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      dp = new DataProvider(source)

      r = dp.setItem(2, {index:100, bar:200})
      expect(r).to.equal null
      expect(dp.source.data).to.deep.equal {index: [0,1,100,10], bar: [3.4, 1.2, 200, -10]}

    it "should set fields when sorted", ->
      source = new ColumnDataSource({data: {index: [0,1,2,10], bar: [3.4, 1.2, 0, -10]}})
      dp = new DataProvider(source)
      fake_col = {sortAsc: true, sortCol: {field: "bar"}}
      dp.sort([fake_col])

      r = dp.setItem(2, {index:100, bar:200})
      expect(r).to.equal null
      expect(dp.source.data).to.deep.equal {index: [0,100,2,10], bar: [3.4, 200, 0, -10]}
