import {expect} from "assertions"

import {SymmetricDifferenceFilter} from "@bokehjs/models/filters/symmetric_difference_filter"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("SymmetricDifferenceFilter", () => {
  const cds = new ColumnDataSource({
    data: {
      x: ["a", "a", "b", "b", "b"],
    },
  })

  describe("supports compute_indices() method", () => {

    it("that returns the correct indices", () => {
      const filter = new SymmetricDifferenceFilter({
        operands: [
          new IndexFilter({indices: [0, 2, 3]}),
          new IndexFilter({indices: [1, 2, 4]}),
        ],
      })
      expect([...filter.compute_indices(cds)]).to.be.equal([0, 1, 3, 4])
    })
  })
})
