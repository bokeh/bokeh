import {expect} from "#framework/assertions"

import {GroupFilter} from "@bokehjs/models/filters/group_filter"
import {Float64NDArray} from "@bokehjs/core/util/ndarray"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("GroupFilter", () => {
  const cds = ColumnDataSource.create({
    data: {
      x: ["a", "a", "b", "b", "b"],
      y: [0.0, NaN, Infinity, NaN, 1.0],
    },
  })

  describe("compute_indices", () => {

    it("returns the correct indices when field_name is in the data source", () => {
      const group_filter = GroupFilter.create({field_name: "x", group: "a"})
      expect([...group_filter.compute_indices(cds)]).to.be.equal([0, 1])
    })

    it("returns empty array when no elements in the column match the group", () => {
      const group_filter = GroupFilter.create({field_name: "x", group: "c"})
      expect([...group_filter.compute_indices(cds)]).to.be.equal([])
    })

    it("returns correct indices when group is NaN", () => {
      const group_filter = GroupFilter.create({field_name: "y", group: NaN})
      expect([...group_filter.compute_indices(cds)]).to.be.equal([1, 3])
    })

    it("compares logical rows of shaped fields", () => {
      const source = ColumnDataSource.create({data: {pairs: new Float64NDArray([1, 2, 3, 4, 1, 2], [3, 2])}})
      const filter = GroupFilter.create({field_name: "pairs", group: [1, 2]})
      expect([...filter.compute_indices(source)]).to.be.equal([0, 2])
    })

    it("returns null when field_name is not in the data source", () => {
      const group_filter = GroupFilter.create({field_name: "z", group: "c"})
      expect([...group_filter.compute_indices(cds)]).to.be.equal([0, 1, 2, 3, 4])
    })
  })
})
