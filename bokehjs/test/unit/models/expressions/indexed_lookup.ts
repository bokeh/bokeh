import {expect} from "#framework/assertions"

import {UnsetValueError} from "@bokehjs/core/properties"
import {is_NDArray, ndarray} from "@bokehjs/core/util/ndarray"
import {IndexedLookup, gather_values} from "@bokehjs/models/expressions/indexed_lookup"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("IndexedLookup", () => {
  it("requires an index field before evaluating", () => {
    const source = ColumnDataSource.create({data: {x: [10]}})
    const primary = ColumnDataSource.create({data: {vertices: [0]}})
    const lookup = IndexedLookup.create({source, field: "x"})

    expect(() => lookup.v_compute(primary)).to.throw(UnsetValueError, ".indices is unset")
    lookup.indices = "vertices"
    expect(lookup.v_compute(primary)).to.be.equal([10])
  })

  it("gathers values with scalar and ragged indices", () => {
    const values = [10, 20, 30, 40]

    expect(gather_values(values, [3, 0, 2])).to.be.equal([40, 10, 30])
    expect(gather_values(values, ndarray(new Int32Array([3, 0, 2])))).to.be.equal([40, 10, 30])
    expect(gather_values(values, [[0, 2], [1, 3, 0]])).to.be.equal([[10, 30], [20, 40, 10]])
  })

  it("preserves the row structure of two-dimensional ndarrays", () => {
    const indices = ndarray(new Int32Array([0, 2, 1, 3]), {shape: [2, 2]})

    expect(gather_values([10, 20, 30, 40], indices)).to.be.equal([[10, 30], [20, 40]])
  })

  it("indexes the logical first axis of shaped values", () => {
    const values = ndarray(new Float32Array([1, 2, 3, 4, 5, 6]), {shape: [3, 2]})
    const result = gather_values(values, [2, 0])

    expect(Array.from(result, (row) => Array.from(row))).to.be.equal([[5, 6], [1, 2]])
    expect(() => gather_values(values, [3])).to.throw(Error, "out of bounds for 3 values")
  })

  it("preserves the inner shape and dtype of multidimensional value rows", () => {
    for (const values of [
      ndarray(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]), {shape: [2, 2, 2]}),
      ndarray([1, 2, 3, 4, 5, 6, 7, 8], {dtype: "object", shape: [2, 2, 2]}),
      ndarray([0, 1, 0, 1, 1, 0, 1, 0], {dtype: "bool", shape: [2, 2, 2]}),
    ]) {
      const [row] = gather_values(values, [1])
      expect(is_NDArray(row)).to.be.true
      if (is_NDArray(row)) {
        expect(row.shape).to.be.equal([2, 2])
        expect(row.dtype).to.be.equal(values.dtype)
        expect(Array.from(row)).to.be.equal(Array.from(values).slice(4))
      }
    }
  })

  it("rejects non-integer and out-of-bounds indices", () => {
    expect(() => gather_values([10], [0.5])).to.throw(Error, "lookup index must be an integer")
    expect(() => gather_values([10], [1])).to.throw(Error, "lookup index 1 is out of bounds")
  })

  it("recomputes when either source changes", () => {
    const vertices = ColumnDataSource.create({data: {x: [0, 1, 2]}})
    const cells = ColumnDataSource.create({data: {vertices: [[0, 1], [1, 2]]}})
    const lookup = IndexedLookup.create({source: vertices, field: "x", indices: "vertices"})

    expect(lookup.v_compute(cells)).to.be.equal([[0, 1], [1, 2]])

    vertices.data = {x: [10, 11, 12]}
    expect(lookup.v_compute(cells)).to.be.equal([[10, 11], [11, 12]])

    cells.data = {vertices: [[2, 0]]}
    expect(lookup.v_compute(cells)).to.be.equal([[12, 10]])

    vertices.data = {x: [10, 11, 12], y: [20, 21, 22]}
    lookup.field = "y"
    expect(lookup.v_compute(cells)).to.be.equal([[22, 20]])
  })

  it("rejects invalid indices and unsupported shapes", () => {
    for (const index of [NaN, Infinity, -1, 1, 0.5, "0", true, null, undefined]) {
      expect(() => gather_values([10], [index])).to.throw(Error)
    }
    const indices = ndarray(new Int32Array([0]), {shape: [1, 1, 1]})
    expect(() => gather_values([10], indices)).to.throw(Error, "one- or two-dimensional")
    expect(gather_values([], [])).to.be.equal([])
    expect(gather_values([10], [[], [0]])).to.be.equal([[], [10]])
  })

  it("invalidates for streaming, patching, and source replacement", () => {
    const values = ColumnDataSource.create({data: {x: [10, 20]}})
    const indices = ColumnDataSource.create({data: {vertices: [0]}})
    const lookup = IndexedLookup.create({source: values, field: "x", indices: "vertices"})
    expect(lookup.v_compute(indices)).to.be.equal([10])
    values.patch({x: [[0, 11]]})
    expect(lookup.v_compute(indices)).to.be.equal([11])
    values.stream({x: [30]})
    indices.stream({vertices: [2]})
    expect(lookup.v_compute(indices)).to.be.equal([11, 30])
    indices.patch({vertices: [[0, 1]]})
    expect(lookup.v_compute(indices)).to.be.equal([20, 30])
    const replacement = ColumnDataSource.create({data: {x: [100, 200, 300]}})
    lookup.source = replacement
    expect(lookup.v_compute(indices)).to.be.equal([200, 300])
    replacement.patch({x: [[1, 201]]})
    expect(lookup.v_compute(indices)).to.be.equal([201, 300])
    expect(lookup.v_compute(ColumnDataSource.create({data: {vertices: [0]}}))).to.be.equal([100])
    lookup.indices = "missing"
    expect(() => lookup.v_compute(indices)).to.throw(Error, "unknown index field")
    lookup.indices = "vertices"
    lookup.field = "missing"
    expect(() => lookup.v_compute(indices)).to.throw(Error, "unknown lookup field")
  })
})
