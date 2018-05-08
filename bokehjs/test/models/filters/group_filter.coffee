{expect} = require "chai"

{GroupFilter} = require("models/filters/group_filter")
{ColumnDataSource} = require("models/sources/column_data_source")

describe "GroupFilter", ->

  cds = new ColumnDataSource({
    data:
      x: ["a", "a", "b", "b", "b"]
  })

  describe "compute_indices", ->

    it "returns the correct indices when column_name is in the data source", ->
      group_filter = new GroupFilter({column_name: "x", group: "a"})
      expect(group_filter.compute_indices(cds)).to.be.deep.equal([0, 1])

    it "returns empty array when no elements in the column match the group", ->
      group_filter = new GroupFilter({column_name: "x", group: "c"})
      expect(group_filter.compute_indices(cds)).to.be.deep.equal([])

    it "returns null when column_name is not in the data source", ->
      group_filter = new GroupFilter({column_name: "y", group: "c"})
      expect(group_filter.compute_indices(cds)).to.be.null
