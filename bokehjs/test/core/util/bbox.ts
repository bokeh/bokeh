import {expect} from "chai"

import * as bbox from "core/util/bbox"

describe("bbox module", () => {
  describe("empty", () => {
    it("should be an unbounded box", () => {
      expect(bbox.empty()).to.deep.equal({minX: Infinity, minY: Infinity, maxX: -Infinity, maxY:-Infinity})
    })
  })

  describe("positive_x", () => {
    it("should be box covering the area where x is positive", () => {
      expect(bbox.positive_x()).to.deep.equal({minX: Number.MIN_VALUE, minY: -Infinity, maxX: Infinity, maxY: Infinity})
    })
  })

  describe("positive_y", () => {
    it("should be box covering the area where y is positive", () => {
      expect(bbox.positive_y()).to.deep.equal({minX: -Infinity, minY: Number.MIN_VALUE, maxX: Infinity, maxY: Infinity})
    })
  })

  describe("union", () => {
    const empty    = bbox.empty()
    const outside  = {minX: 0, maxX: 10, minY:  0, maxY: 10}
    const inside   = {minX: 4, maxX:  5, minY:  4, maxY: 5 }
    const overlaps = {minX:-5, maxX:  5, minY: -5, maxY: 5 }

    it("should return empty when inputs are empty", () => {
      expect(bbox.union(empty, empty)).to.deep.equal(empty)
    })

    it("should return the non-empty bbox when one input is empty", () => {
      expect(bbox.union(empty, outside)).to.deep.equal(outside)
      expect(bbox.union(outside, empty)).to.deep.equal(outside)
    })

    it("should return the bigger box if one bbox contains another", () => {
      expect(bbox.union(inside, outside)).to.deep.equal(outside)
      expect(bbox.union(outside, inside)).to.deep.equal(outside)
    })

    it("should return the envelope of overlapping bboxes", () => {
      expect(bbox.union(overlaps, outside)).to.deep.equal({minX: -5, maxX: 10, minY: -5, maxY: 10})
      expect(bbox.union(outside, overlaps)).to.deep.equal({minX: -5, maxX: 10, minY: -5, maxY: 10})
    })

    it("should return the envelope of disjoint bboxes", () => {
      expect(bbox.union(overlaps, outside)).to.deep.equal({minX: -5, maxX: 10, minY: -5, maxY: 10})
      expect(bbox.union(outside, overlaps)).to.deep.equal({minX: -5, maxX: 10, minY: -5, maxY: 10})
    })
  })
})
