{expect} = require "chai"
utils = require "../../utils"

bbox = utils.require "core/util/bbox"

describe "bbox module", ->

  describe "empty", ->

    it "should return an unbounded box", ->
      expect(bbox.empty()).to.deep.equal [[Infinity, -Infinity], [Infinity, -Infinity]]

  describe "union", ->
    empty    = bbox.empty()
    outside  = [[0, 10], [0, 10]]
    inside   = [[4, 5], [4, 5]]
    overlaps = [[-5, 5], [-5, 5]]
    disjoint = [[-5, -1], [-5, -1]]

    it "should return empty when inputs are empty", ->
      expect(bbox.union(empty, empty)).to.deep.equal empty

    it "should return the non-empty bbox when one input is empty", ->
      expect(bbox.union(empty, outside)).to.deep.equal outside
      expect(bbox.union(outside, empty)).to.deep.equal outside

    it "should return the bigger box if one bbox contains another", ->
      expect(bbox.union(inside, outside)).to.deep.equal outside
      expect(bbox.union(outside, inside)).to.deep.equal outside

    it "should return the envelope of overlapping bboxes", ->
      expect(bbox.union(overlaps, outside)).to.deep.equal [[-5, 10,], [-5, 10]]
      expect(bbox.union(outside, overlaps)).to.deep.equal [[-5, 10,], [-5, 10]]

    it "should return the envelope of disjoint bboxes", ->
      expect(bbox.union(overlaps, outside)).to.deep.equal [[-5, 10,], [-5, 10]]
      expect(bbox.union(outside, overlaps)).to.deep.equal [[-5, 10,], [-5, 10]]
