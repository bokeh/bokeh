import {expect} from "chai"

import {IndexFilter} from "models/filters/index_filter"
import {ColumnDataSource} from "models/sources/column_data_source"

describe("IndexFilter", () => {

  const cds = new ColumnDataSource({
    data: {
      x: ["a", "a", "b", "b", "b"],
    },
  })

  describe("compute_indices", () => {

    it("returns the correct indices when indices is all ints", () => {
      const index_filter = new IndexFilter({indices: [0, 1, 3]})
      expect(index_filter.compute_indices(cds)).to.be.deep.equal([0, 1, 3])
    })

    it("returns null when indices has floats", () => {
      const index_filter = new IndexFilter({indices: [0.2, 1, 3]})
      expect(index_filter.compute_indices(cds)).to.be.null
    })

    it("returns [] when indices is an empty array", () => {
      const index_filter = new IndexFilter({indices: []})
      expect(index_filter.compute_indices(cds)).to.be.deep.equal([])
    })

    it("returns null when not initialized with indices", () => {
      const index_filter = new IndexFilter()
      expect(index_filter.compute_indices(cds)).to.be.null
    })
  })
})
