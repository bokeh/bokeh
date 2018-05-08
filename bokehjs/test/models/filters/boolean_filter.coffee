{expect} = require "chai"

{BooleanFilter} = require("models/filters/boolean_filter")
{ColumnDataSource} = require("models/sources/column_data_source")

describe "BooleanFilter", ->

  cds = new ColumnDataSource({
    data:
      x: ["a", "a", "b", "b", "b"]
  })

  describe "compute_indices", ->

    it "returns the correct indices when booleans is all boooleans", ->
        boolean_filter = new BooleanFilter({booleans: [false, true, true]})
        expect(boolean_filter.compute_indices(cds)).to.be.deep.equal([1, 2])

    it "returns null when booleans has non-booleans", ->
        boolean_filter = new BooleanFilter({booleans: [0.2, 1, 3]})
        expect(boolean_filter.compute_indices()).to.be.null

    it "returns null when booleans is an empty array", ->
        boolean_filter = new BooleanFilter({booleans: []})
        expect(boolean_filter.compute_indices()).to.be.null

    it "returns null when not initialized with booleans", ->
        boolean_filter = new BooleanFilter()
        expect(boolean_filter.compute_indices()).to.be.null
