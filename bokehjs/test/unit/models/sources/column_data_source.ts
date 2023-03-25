import {expect} from "assertions"

import {with_log_level} from "@bokehjs/core/logging"

import {keys} from "@bokehjs/core/util/object"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {Int32NDArray, Float32NDArray, Float64NDArray} from "@bokehjs/core/util/ndarray"

import {trap} from "../../../util"

describe("column_data_source module", () => {

  describe("default creation", () => {
    const r = new ColumnDataSource()

    it("should have empty data", () => {
      expect(r.data).to.be.equal({})
    })

    it("should have empty columns", () => {
      expect(r.columns()).to.be.equal([])
    })

    it("should return null for get_length", () => {
      expect(r.get_length()).to.be.null
    })
  })

  describe("single column added", () => {
    const r = new ColumnDataSource({data: {foo: []}})

    it("should return supplied data", () => {
      expect(r.data).to.be.equal({foo: []})
    })

    it("should return one column", () => {
      expect(r.columns()).to.be.equal(["foo"])
    })
  })

  describe("multiple columns added", () => {
    const r = new ColumnDataSource({data: {foo: [], bar: []}})

    it("should return supplied data", () => {
      expect(r.data).to.be.equal({foo: [], bar: []})
    })

    it("should return all columns", () => {
      expect((r.columns()).sort()).to.be.equal(["bar", "foo"])
    })
  })

  describe("get_length function", () => {

    it("should return 0 for empty columns", () => {
      const r0 = new ColumnDataSource({data: {foo: []}})
      expect(r0.get_length()).to.be.equal(0)

      const r1 = new ColumnDataSource({data: {foo: [], bar: []}})
      expect(r1.get_length()).to.be.equal(0)
    })

    it("should return common length for columns with data", () => {
      const r0 = new ColumnDataSource({data: {foo: [10]}})
      expect(r0.get_length()).to.be.equal(1)

      const r1 = new ColumnDataSource({data: {foo: [10], bar: [10]}})
      expect(r1.get_length()).to.be.equal(1)

      const r2 = new ColumnDataSource({data: {foo: [10, 20], bar: [10, 20]}})
      expect(r2.get_length()).to.be.equal(2)
    })

    it("should not alert for consistent column lengths (including zero)", () => {
      with_log_level("info", () => {
        const r0 = new ColumnDataSource({data: {foo: []}})
        const out0 = trap(() => r0.get_length())
        expect(out0.warn).to.be.equal("")

        const r1 = new ColumnDataSource({data: {foo: [], bar: []}})
        const out1 = trap(() => r1.get_length())
        expect(out1.warn).to.be.equal("")

        const r2 = new ColumnDataSource({data: {foo: [10]}})
        const out2 = trap(() => r2.get_length())
        expect(out2.warn).to.be.equal("")

        const r3 = new ColumnDataSource({data: {foo: [10], bar: [10]}})
        const out3 = trap(() => r3.get_length())
        expect(out3.warn).to.be.equal("")

        const r4 = new ColumnDataSource({data: {foo: [10, 20], bar: [10, 20]}})
        const out4 = trap(() => r4.get_length())
        expect(out4.warn).to.be.equal("")
      })
    })

    it("should alert if column lengths are inconsistent", () => {
      with_log_level("info", () => {
        const r0 = new ColumnDataSource({data: {foo: [1], bar: [1, 2]}})
        const out0 = trap(() => r0.get_length())
        expect(out0.warn).to.be.equal("[bokeh] data source has columns of inconsistent lengths\n")

        const r1 = new ColumnDataSource({data: {foo: [1], bar: [1, 2], baz: [1]}})
        const out1 = trap(() => r1.get_length())
        expect(out1.warn).to.be.equal("[bokeh] data source has columns of inconsistent lengths\n")
      })
    })
  })

  describe("columns method", () => {

    it("should report .data.keys", () => {
      const r = new ColumnDataSource({data: {foo: [10, 20], bar: [10, 20]}})
      expect(r.columns()).to.be.equal(keys(r.data))
    })

    it("should update if columns update", () => {
      const r = new ColumnDataSource({data: {foo: [10, 20], bar: [10, 20]}})
      r.data.baz = [11, 21]
      expect(r.columns()).to.be.equal(keys(r.data))
    })
  })

  describe("clear method", () => {

    it("should clear plain arrys to plain arrays", () => {
      const r = new ColumnDataSource({data: {foo: [10, 20], bar: [10, 20]}})
      r.clear()
      expect(r.data).to.be.equal({foo: [], bar: []})
    })

    it("should clear typed arrays to typed arrays", () => {
      for (const typ of [Float32NDArray, Float64NDArray, Int32NDArray]) {
        const r = new ColumnDataSource({data: {foo: [10, 20], bar: new typ([1, 2])}})
        r.clear()
        expect(r.data).to.be.equal({foo: [], bar: new typ([])})
      }
    })

    it("should clear columns added later", () => {
      for (const typ of [Float32NDArray, Float64NDArray, Int32NDArray]) {
        const r = new ColumnDataSource({data: {foo: [10, 20]}})
        r.data.bar = [100, 200]
        r.data.baz = new typ([1, 2])
        r.clear()
        expect(r.data).to.be.equal({foo: [], bar: [], baz: new typ([])})
      }
    })
  })
})
