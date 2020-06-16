import {expect} from "assertions"

import {Filter} from "@bokehjs/models/filters/filter"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("Filter", () => {

  const cds = new ColumnDataSource({
    data: {
      x: ["a", "a", "b", "b", "b"],
    },
  })

  describe("compute_indices", () => {

    it("returns the correct indices when filter is all booleans", () => {
      const filter = new Filter({filter: [true, true, false, true]})
      expect(filter.compute_indices(cds)).to.be.equal([0, 1, 3])
    })

    it("returns the correct indices when filter is all ints", () => {
      const filter = new Filter({filter: [0, 1, 3]})
      expect(filter.compute_indices(cds)).to.be.equal([0, 1, 3])
    })

    it("returns null when filter is not all booleans or all ints", () => {
      const filter = new Filter({filter: [true, 1, 3] as any}) // XXX
      expect(filter.compute_indices(cds)).to.be.null
    })

    it("returns null when filter has floats", () => {
      const filter = new Filter({filter: [0.2, 1, 3]})
      expect(filter.compute_indices(cds)).to.be.null
    })

    it("returns [] when filter is an empty array", () => {
      const filter = new Filter({filter: []})
      expect(filter.compute_indices(cds)).to.be.equal([])
    })

    it("returns null when not initialized with filter", () => {
      const filter = new Filter()
      expect(filter.compute_indices(cds)).to.be.null
    })
  })
})
