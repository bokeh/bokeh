import {expect} from "assertions"

import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("IndexFilter", () => {

  const cds = new ColumnDataSource({
    data: {
      x: ["a", "a", "b", "b", "b"],
    },
  })

  describe("compute_indices", () => {

    it("returns the correct indices when indices is all ints", () => {
      const index_filter = new IndexFilter({indices: [0, 1, 3]})
      expect([...index_filter.compute_indices(cds)]).to.be.equal([0, 1, 3])
    })

    it("returns [] when indices is an empty array", () => {
      const index_filter = new IndexFilter({indices: []})
      expect([...index_filter.compute_indices(cds)]).to.be.equal([])
    })

    it("returns null when not initialized with indices", () => {
      const index_filter = new IndexFilter()
      expect([...index_filter.compute_indices(cds)]).to.be.equal([0, 1, 2, 3, 4])
    })
  })
})
