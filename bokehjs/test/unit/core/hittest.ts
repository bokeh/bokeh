import {expect} from "#framework/assertions"

import * as hittest from "@bokehjs/core/hittest"

describe("hittest module", () => {

  for (const [sx0, sy0, sx1, sy1] of [[0, 0, 10, 10], [10, 10, 0, 0]]) {
    const rect = {type: "rect", sx0, sy0, sx1, sy1} as const
    describe(`rectangle tests with corners (${sx0}, ${sy0}), (${sx1}, ${sy1})`, () => {
      it("should include interior points and boundary points, and reject exterior points", () => {
        for (const point of [{x: 5, y: 5}, {x: 0, y: 5}, {x: 10, y: 10}]) {
          expect(hittest.point_in_rect(point, rect)).to.be.true
        }
        for (const point of [{x: -1, y: 5}, {x: 5, y: 11}]) {
          expect(hittest.point_in_rect(point, rect)).to.be.false
        }
      })

      it("should detect crossing, contained, and disjoint segments", () => {
        expect(hittest.segment_intersects_rect({x: -5, y: 5}, {x: 15, y: 5}, rect)).to.be.true
        expect(hittest.segment_intersects_rect({x: 2, y: 2}, {x: 8, y: 8}, rect)).to.be.true
        expect(hittest.segment_intersects_rect({x: -5, y: 15}, {x: 15, y: 15}, rect)).to.be.false
      })

      it("should handle zero-length segments inside and outside the rectangle", () => {
        expect(hittest.segment_intersects_rect({x: 5, y: 5}, {x: 5, y: 5}, rect)).to.be.true
        expect(hittest.segment_intersects_rect({x: 15, y: 15}, {x: 15, y: 15}, rect)).to.be.false
      })
    })
  }

  describe("point_in_poly", () => {
    it("should return false if (x,y) point is outside a polygon", () => {
      expect(hittest.point_in_poly(1.01, 4, [1, 2, 2, 1], [4, 5, 8, 9])).to.be.false
    })

    it("should return true if (x,y) point is inside a polygon", () => {
      expect(hittest.point_in_poly(1.5, 5, [1, 2, 2, 1], [4, 5, 8, 9])).to.be.true
    })

    it("should return false if (x,y) point is on the edge of a polygon", () => {
      expect(hittest.point_in_poly(1, 4, [1, 2, 2, 1], [4, 5, 8, 9])).to.be.false
    })

  })

  describe("point_in_ellipse", () => {
    it("should return false if (x,y) point is outside an ellipse", () => {
      expect(hittest.point_in_ellipse(2.1, 1, 0, 1.5, 1, 1, 1)).to.be.false
    })

    it("should return true if (x,y) point is inside an ellipse", () => {
      expect(hittest.point_in_ellipse(2, 1, 0, 1.5, 1, 1, 1)).to.be.true
      expect(hittest.point_in_ellipse(2, 1, Math.PI/4, 1.5, 1, 1, 1)).to.be.true
    })

    it("should return false if (x,y) point is on the edge of an ellipse", () => {
      expect(hittest.point_in_ellipse(2, 3, 0, 2, 4, 1, 1)).to.be.false
    })
  })

  describe("dist_2_pts", () => {
    it("should compute the squared L2 distance for two points", () => {
      // identical points
      expect(hittest.dist_2_pts({x: 0, y: 0}, {x: 0, y: 0})).to.be.equal(0)
      expect(hittest.dist_2_pts({x: 1, y: 1}, {x: 1, y: 1})).to.be.equal(0)
      expect(hittest.dist_2_pts({x: -1, y: 10}, {x: -1, y: 10})).to.be.equal(0)

      // x-dir separation
      expect(hittest.dist_2_pts({x: 1, y: 1}, {x: 5, y: 1})).to.be.equal(16)
      expect(hittest.dist_2_pts({x: 5, y: 1}, {x: 1, y: 1})).to.be.equal(16)

      // y-dir separation
      expect(hittest.dist_2_pts({x: 1, y: 1}, {x: 1, y: 5})).to.be.equal(16)
      expect(hittest.dist_2_pts({x: 1, y: 5}, {x: 1, y: 1})).to.be.equal(16)

      // arbitrary separation
      expect(hittest.dist_2_pts({x: -1, y: 1}, {x: 2, y: 3})).to.be.equal(13)
      expect(hittest.dist_2_pts({x: 2, y: 3}, {x: -1, y: 1})).to.be.equal(13)
    })
  })

  describe("vertex_overlap", () => {
    it("should return false if no vertices overlap", () => {
      expect(hittest.vertex_overlap([1, 2, 2, 1], [1, 1, 2, 2], [4, 5, 5, 4], [1, 1, 2, 2])).to.be.false
    })
    it("should return true if one vertex overlaps", () => {
      expect(hittest.vertex_overlap([1, 4, 4, 1], [1, 1, 4, 4], [2, 5, 5, 2], [2, 2, 5, 5])).to.be.true
      expect(hittest.vertex_overlap([2, 5, 5, 2], [2, 2, 5, 5], [1, 4, 4, 1], [1, 1, 4, 4])).to.be.true
    })
    it("should return true if all vertices overlap", () => {
      expect(hittest.vertex_overlap([1, 4, 4, 1], [1, 1, 4, 4], [2, 3, 3, 2], [2, 2, 3, 3])).to.be.true
      expect(hittest.vertex_overlap([2, 3, 3, 2], [2, 2, 3, 3], [1, 4, 4, 1], [1, 1, 4, 4])).to.be.true
    })
  })

  describe("edge_intersection", () => {
    it("should return false if no edges intersect", () => {
      expect(hittest.edge_intersection([1, 2, 2, 1], [1, 1, 2, 2], [4, 5, 5, 4], [1, 1, 2, 2])).to.be.false
      expect(hittest.edge_intersection([4, 5, 5, 4], [1, 1, 2, 2], [1, 2, 2, 1], [1, 1, 2, 2])).to.be.false
    })
    it("should return true if any edges intersect", () => {
      expect(hittest.edge_intersection([1, 4, 4, 1], [1, 1, 4, 4], [2, 5, 5, 2], [2, 2, 5, 5])).to.be.true
      expect(hittest.edge_intersection([1, 4, 4, 1], [1, 1, 4, 4], [2, -5, -5, 2], [2, 2, -5, -5])).to.be.true
    })
  })

})
