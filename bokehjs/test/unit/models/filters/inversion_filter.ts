import {expect} from "assertions"

import {InversionFilter} from "@bokehjs/models/filters/inversion_filter"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("InversionFilter", () => {
  const cds = new ColumnDataSource({
    data: {
      x: ["a", "a", "b", "b", "b"],
    },
  })

  describe("supports compute_indices() method", () => {

    it("that returns the correct indices", () => {
      const filter = new InversionFilter({
        operand: new IndexFilter({indices: [1, 2, 4]}),
      })
      expect([...filter.compute_indices(cds)]).to.be.equal([0, 3])
    })
  })
})
