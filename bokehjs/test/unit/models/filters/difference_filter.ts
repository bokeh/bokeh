import {expect} from "#framework/assertions"

import {DifferenceFilter} from "@bokehjs/models/filters/difference_filter"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("DifferenceFilter", () => {
  const cds = ColumnDataSource.create({
    data: {
      x: ["a", "a", "b", "b", "b"],
    },
  })

  describe("supports compute_indices() method", () => {

    it("that returns the correct indices", () => {
      const filter = DifferenceFilter.create({
        operands: [
          IndexFilter.create({indices: [0, 2, 3]}),
          IndexFilter.create({indices: [1, 2, 4]}),
        ],
      })
      expect([...filter.compute_indices(cds)]).to.be.equal([0, 3])
    })
  })
})
