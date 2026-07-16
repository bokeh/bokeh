import {expect} from "#framework/assertions"
import {trap} from "#framework/util"

import {with_log_level} from "@bokehjs/core/logging"
import {version} from "@bokehjs/version"

import {keys} from "@bokehjs/core/util/object"
import {Selection} from "@bokehjs/models/selections/selection"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {Int32NDArray, Float32NDArray, Float64NDArray, ndarray} from "@bokehjs/core/util/ndarray"

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
        expect(out0.warn).to.be.equal(`[bokeh ${version}] data source has columns of inconsistent lengths\n`)

        const r1 = new ColumnDataSource({data: {foo: [1], bar: [1, 2], baz: [1]}})
        const out1 = trap(() => r1.get_length())
        expect(out1.warn).to.be.equal(`[bokeh ${version}] data source has columns of inconsistent lengths\n`)
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
      r.set("baz", [11, 21])
      expect(r.columns()).to.be.equal(keys(r.data))
    })
  })

  describe("clear method", () => {

    it("should clear plain arrays to empty arrays", () => {
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
        r.set("bar", [100, 200])
        r.set("baz", new typ([1, 2]))
        r.clear()
        expect(r.data).to.be.equal({foo: [], bar: [], baz: new typ([])})
      }
    })
  })

  describe("inferred_defaults getter", () => {
    const cds = new ColumnDataSource({
      data: {
        d0: [],
        d1: [null, false, 0],
        d2: [true, false, true],
        d3: [false, true, false],
        d4: [0, 1, 2, 3],
        d5: [1, 2, 3, 4],
        d6: ["a", "b", "c"],
        d7: ndarray([], {dtype: "bool"}),
        d8: ndarray([], {dtype: "uint32"}),
        d9: ndarray([], {dtype: "float64"}),
        d10: ndarray([1, 2, 3], {dtype: "object"}),
        d11: ndarray([1, 0, 1], {dtype: "bool"}),
        d12: ndarray([1, 2, 3], {dtype: "uint32"}),
        d13: ndarray([1, 2, 3], {dtype: "float64"}),
        d14: ndarray([1, 2, 3], {dtype: "object"}),
        // TODO d15: new Map([[0, "a"], [1, "b"], [2, "c"]]),
      },
    })
    expect(cds.inferred_defaults).to.be.equal(new Map<string, unknown>([
      ["d1", null],
      ["d2", false],
      ["d3", false],
      ["d4", 0],
      ["d5", 0],
      ["d6", ""],
      ["d7", false],
      ["d8", 0],
      ["d9", 0],
      ["d10", null],
      ["d11", false],
      ["d12", 0],
      ["d13", 0],
      ["d14", null],
      // TODO ["d15", new Map([[0, "a"], [1, "b"], [2, "c"]])],
    ]))
  })

  describe("selection pruning", () => {
    it("should prune out-of-bounds indices when data is replaced", () => {
      const selected = new Selection({
        indices: [-1, 0, 2, 3],
        line_indices: [-1, 0, 2, 3],
        multiline_indices: new Map([[-1, [0]], [0, [0]], [2, [0]], [3, [0]]]),
        image_indices: [
          {index: -1, i: 0, j: 0, flat_index: 0},
          {index: 0, i: 0, j: 0, flat_index: 0},
          {index: 2, i: 0, j: 0, flat_index: 0},
          {index: 3, i: 0, j: 0, flat_index: 0},
        ],
      })
      const source = new ColumnDataSource({data: {foo: [0, 1, 2, 3]}, selected})

      source.data = {foo: [0, 1]}

      expect(selected.indices).to.be.equal([0])
      expect(selected.line_indices).to.be.equal([0])
      expect(selected.multiline_indices).to.be.equal(new Map([[0, [0]]]))
      expect(selected.image_indices).to.be.equal([{index: 0, i: 0, j: 0, flat_index: 0}])

      source.clear()

      expect(selected.indices).to.be.empty
      expect(selected.line_indices).to.be.empty
      expect(selected.multiline_indices).to.be.equal(new Map())
      expect(selected.image_indices).to.be.empty
    })

    it("should prune out-of-bounds indices after streaming with rollover", () => {
      const selected = new Selection({indices: [0, 1, 2, 3]})
      const source = new ColumnDataSource({data: {foo: [0, 1, 2, 3]}, selected})

      source.stream({foo: [4]}, 2)

      expect(source.length).to.be.equal(2)
      expect(selected.indices).to.be.equal([0, 1])
    })

    it("should prune out-of-bounds indices after patching", () => {
      const selected = new Selection({indices: [0, 2]})
      const source = new ColumnDataSource({data: {foo: [0, 1]}, selected})

      source.patch({foo: [[0, 2]]})

      expect(selected.indices).to.be.equal([0])
    })
  })
})
