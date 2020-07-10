import {expect} from "assertions"

import {BooleanFilter} from "@bokehjs/models/filters/boolean_filter"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("BooleanFilter", () => {

  const cds = new ColumnDataSource({
    data: {
      x: ["a", "a", "b", "b", "b"],
    },
  })

  describe("compute_indices", () => {

    it("returns the correct indices", () => {
      const boolean_filter = new BooleanFilter({booleans: [false, true, true, false, false]})
      expect([...boolean_filter.compute_indices(cds)]).to.be.equal([1, 2])
    })

    it("returns the correct indices when too many entries were given", () => {
      const boolean_filter = new BooleanFilter({booleans: [false, true, true, false, false, true]})
      expect([...boolean_filter.compute_indices(cds)]).to.be.equal([1, 2])
    })

    it("returns the correct indices when too few entries were given", () => {
      const boolean_filter = new BooleanFilter({booleans: [false, true, true]})
      expect([...boolean_filter.compute_indices(cds)]).to.be.equal([1, 2])
    })

    it("returns the correct indices when an empty array was given", () => {
      const boolean_filter = new BooleanFilter({booleans: []})
      expect([...boolean_filter.compute_indices(cds)]).to.be.equal([])
    })

    it("returns full set of indices where booleans were not given", () => {
      const boolean_filter = new BooleanFilter()
      expect([...boolean_filter.compute_indices(cds)]).to.be.equal([0, 1, 2, 3, 4])
    })
  })
})
