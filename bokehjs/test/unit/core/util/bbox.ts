import {expect} from "assertions"

import * as bbox from "@bokehjs/core/util/bbox"
import {BBox} from "@bokehjs/core/util/bbox"

describe("bbox module", () => {
  describe("empty", () => {
    it("should be an unbounded box", () => {
      expect(bbox.empty()).to.be.equal({x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity})
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
    const inside   = {x0: 4, x1:  5, y0:  4, y1: 5}
    const overlaps = {x0: -5, x1:  5, y0: -5, y1: 5}

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

  describe("BBox class", () => {
    it("should support clone() method", () => {
      const bbox0 = new BBox({x: 10, y: 20, width: 30, height: 40})
      const bbox1 = bbox0.clone()

      expect(bbox0 !== bbox1).to.be.true

      expect(bbox1.x).to.be.equal(10)
      expect(bbox1.y).to.be.equal(20)
      expect(bbox1.width).to.be.equal(30)
      expect(bbox1.height).to.be.equal(40)
    })

    it("should support from_lrtb() static method", () => {
      const bbox0 = BBox.from_lrtb({left: 0, right: 1, top: 2, bottom: 3})
      expect(bbox0.left).to.be.equal(0)
      expect(bbox0.right).to.be.equal(1)
      expect(bbox0.top).to.be.equal(2)
      expect(bbox0.bottom).to.be.equal(3)

      const bbox1 = BBox.from_lrtb({left: 1, right: 0, top: 2, bottom: 3})
      expect(bbox1.left).to.be.equal(0)
      expect(bbox1.right).to.be.equal(1)
      expect(bbox1.top).to.be.equal(2)
      expect(bbox1.bottom).to.be.equal(3)

      const bbox2 = BBox.from_lrtb({left: 1, right: 0, top: 3, bottom: 2})
      expect(bbox2.left).to.be.equal(0)
      expect(bbox2.right).to.be.equal(1)
      expect(bbox2.top).to.be.equal(2)
      expect(bbox2.bottom).to.be.equal(3)
    })

    it("should support grow_by() method", () => {
      const bbox = new BBox({left: -1, right: 2, top: 0, bottom: 10})
      expect(bbox.grow_by(2)).to.be.equal(new BBox({left: -3, right: 4, top: -2, bottom: 12}))
    })

    it("should support shrink_by() method", () => {
      const bbox = new BBox({left: -3, right: 4, top: -2, bottom: 12})
      expect(bbox.shrink_by(2)).to.be.equal(new BBox({left: -1, right: 2, top: 0, bottom: 10}))
    })
  })
})
