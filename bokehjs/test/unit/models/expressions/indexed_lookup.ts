import {expect} from "#framework/assertions"

import {ndarray} from "@bokehjs/core/util/ndarray"
import {IndexedLookup, gather_values} from "@bokehjs/models/expressions/indexed_lookup"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("IndexedLookup", () => {
  it("gathers values with scalar and ragged indices", () => {
    const values = [10, 20, 30, 40]

    expect(gather_values(values, [3, 0, 2])).to.be.equal([40, 10, 30])
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
  })

  it("rejects non-integer and out-of-bounds indices", () => {
    expect(() => gather_values([10], [0.5])).to.throw(Error, "lookup index must be an integer")
    expect(() => gather_values([10], [1])).to.throw(Error, "lookup index 1 is out of bounds")
  })

  it("recomputes when either source changes", () => {
    const vertices = ColumnDataSource.create({data: {x: [0, 1, 2]}})
    const cells = ColumnDataSource.create({data: {vertices: [[0, 1], [1, 2]]}})
    const lookup = IndexedLookup.create({source: vertices, field: "x"})

    expect(lookup.v_compute(cells)).to.be.equal([[0, 1], [1, 2]])

    vertices.data = {x: [10, 11, 12]}
    expect(lookup.v_compute(cells)).to.be.equal([[10, 11], [11, 12]])

    cells.data = {vertices: [[2, 0]]}
    expect(lookup.v_compute(cells)).to.be.equal([[12, 10]])

    vertices.data = {x: [10, 11, 12], y: [20, 21, 22]}
    lookup.field = "y"
    expect(lookup.v_compute(cells)).to.be.equal([[22, 20]])
  })
})
