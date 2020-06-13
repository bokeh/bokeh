import {expect} from "assertions"

import {GroupFilter} from "@bokehjs/models/filters/group_filter"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("GroupFilter", () => {

  const cds = new ColumnDataSource({
    data: {
      x: ["a", "a", "b", "b", "b"],
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

    it("returns null when column_name is not in the data source", () => {
      const group_filter = new GroupFilter({column_name: "y", group: "c"})
      expect([...group_filter.compute_indices(cds)]).to.be.equal([0, 1, 2, 3, 4])
    })
  })
})
