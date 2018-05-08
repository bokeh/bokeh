{expect} = require "chai"

{Filter} = require("models/filters/filter")

describe "Filter", ->

  describe "compute_indices", ->

    it "returns the correct indices when filter is all booleans", ->
        filter = new Filter({filter: [true, true, false, true]})
        expect(filter.compute_indices()).to.be.deep.equal([0, 1, 3])

    it "returns the correct indices when filter is all ints", ->
        filter = new Filter({filter: [0, 1, 3]})
        expect(filter.compute_indices()).to.be.deep.equal([0, 1, 3])

    it "returns null when filter is not all booleans or all ints", ->
        filter = new Filter({filter: [true, 1, 3]})
        expect(filter.compute_indices()).to.be.null

    it "returns null when filter has floats", ->
        filter = new Filter({filter: [0.2, 1, 3]})
        expect(filter.compute_indices()).to.be.null

    it "returns [] when filter is an empty array", ->
        filter = new Filter({filter: []})
        expect(filter.compute_indices()).to.be.deep.equal([])

    it "returns null when not initialized with filter", ->
        filter = new Filter()
        expect(filter.compute_indices()).to.be.null
