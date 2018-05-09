{expect} = require "chai"

{IndexFilter} = require("models/filters/index_filter")

describe "IndexFilter", ->

  describe "compute_indices", ->

    it "returns the correct indices when indices is all ints", ->
        index_filter = new IndexFilter({indices: [0, 1, 3]})
        expect(index_filter.compute_indices()).to.be.deep.equal([0, 1, 3])

    it "returns null when indices has floats", ->
        index_filter = new IndexFilter({indices: [0.2, 1, 3]})
        expect(index_filter.compute_indices()).to.be.null

    it "returns [] when indices is an empty array", ->
        index_filter = new IndexFilter({indices: []})
        expect(index_filter.compute_indices()).to.be.deep.equal([])

    it "returns null when not initialized with indices", ->
        index_filter = new IndexFilter()
        expect(index_filter.compute_indices()).to.be.null
