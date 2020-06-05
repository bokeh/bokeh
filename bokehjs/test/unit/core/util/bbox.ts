import {expect} from "assertions"

import * as bbox from "@bokehjs/core/util/bbox"

describe("bbox module", () => {
  describe("empty", () => {
    it("should be an unbounded box", () => {
      expect(bbox.empty()).to.be.equal({x0: Infinity, y0: Infinity, x1: -Infinity, y1:-Infinity})
    })
  })

  describe("positive_x", () => {
    it("should be box covering the area where x is positive", () => {
      expect(bbox.positive_x()).to.be.equal({x0: Number.MIN_VALUE, y0: -Infinity, x1: Infinity, y1: Infinity})
    })
  })

  describe("positive_y", () => {
    it("should be box covering the area where y is positive", () => {
      expect(bbox.positive_y()).to.be.equal({x0: -Infinity, y0: Number.MIN_VALUE, x1: Infinity, y1: Infinity})
    })
  })

  describe("union", () => {
    const empty    = bbox.empty()
    const outside  = {x0: 0, x1: 10, y0:  0, y1: 10}
    const inside   = {x0: 4, x1:  5, y0:  4, y1: 5 }
    const overlaps = {x0:-5, x1:  5, y0: -5, y1: 5 }

    it("should return empty when inputs are empty", () => {
      expect(bbox.union(empty, empty)).to.be.equal(empty)
    })

    it("should return the non-empty bbox when one input is empty", () => {
      expect(bbox.union(empty, outside)).to.be.equal(outside)
      expect(bbox.union(outside, empty)).to.be.equal(outside)
    })

    it("should return the bigger box if one bbox contains another", () => {
      expect(bbox.union(inside, outside)).to.be.equal(outside)
      expect(bbox.union(outside, inside)).to.be.equal(outside)
    })

    it("should return the envelope of overlapping bboxes", () => {
      expect(bbox.union(overlaps, outside)).to.be.equal({x0: -5, x1: 10, y0: -5, y1: 10})
      expect(bbox.union(outside, overlaps)).to.be.equal({x0: -5, x1: 10, y0: -5, y1: 10})
    })

    it("should return the envelope of disjoint bboxes", () => {
      expect(bbox.union(overlaps, outside)).to.be.equal({x0: -5, x1: 10, y0: -5, y1: 10})
      expect(bbox.union(outside, overlaps)).to.be.equal({x0: -5, x1: 10, y0: -5, y1: 10})
    })
  })
})
