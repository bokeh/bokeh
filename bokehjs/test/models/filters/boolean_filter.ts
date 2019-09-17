import {expect} from "chai"

import {BooleanFilter} from "@bokehjs/models/filters/boolean_filter"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("BooleanFilter", () => {

  const cds = new ColumnDataSource({
    data: {
      x: ["a", "a", "b", "b", "b"],
    },
  })

  describe("compute_indices", () => {

    it("returns the correct indices when booleans is all boooleans", () => {
      const boolean_filter = new BooleanFilter({booleans: [false, true, true]})
      expect(boolean_filter.compute_indices(cds)).to.be.deep.equal([1, 2])
    })

    it("returns null when booleans has non-booleans", () => {
      const boolean_filter = new BooleanFilter({booleans: [0.2, 1, 3] as any}) // XXX
      expect(boolean_filter.compute_indices(cds)).to.be.null
    })

    it("returns null when booleans is an empty array", () => {
      const boolean_filter = new BooleanFilter({booleans: []})
      expect(boolean_filter.compute_indices(cds)).to.be.null
    })

    it("returns null when not initialized with booleans", () => {
      const boolean_filter = new BooleanFilter()
      expect(boolean_filter.compute_indices(cds)).to.be.null
    })
  })
})
