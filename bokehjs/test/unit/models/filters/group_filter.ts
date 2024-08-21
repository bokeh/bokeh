import {expect} from "assertions"

import {GroupFilter} from "@bokehjs/models/filters/group_filter"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("GroupFilter", () => {
  const cds = new ColumnDataSource({
    data: {
      x: ["a", "a", "b", "b", "b"],
      y: [0.0, NaN, Infinity, NaN, 1.0],
    },
  })

  describe("compute_indices", () => {

    it("returns the correct indices when column_name is in the data source", () => {
      const group_filter = new GroupFilter({column_name: "x", group: "a"})
      expect([...group_filter.compute_indices(cds)]).to.be.equal([0, 1])
    })

    it("returns empty array when no elements in the column match the group", () => {
      const group_filter = new GroupFilter({column_name: "x", group: "c"})
      expect([...group_filter.compute_indices(cds)]).to.be.equal([])
    })

    it("returns correct indices when group is NaN", () => {
      const group_filter = new GroupFilter({column_name: "y", group: NaN})
      expect([...group_filter.compute_indices(cds)]).to.be.equal([1, 3])
    })

    it("returns null when column_name is not in the data source", () => {
      const group_filter = new GroupFilter({column_name: "z", group: "c"})
      expect([...group_filter.compute_indices(cds)]).to.be.equal([0, 1, 2, 3, 4])
    })
  })
})
