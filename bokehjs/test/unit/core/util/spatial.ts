import {expect} from "assertions"

import {SpatialIndex} from "@bokehjs/core/util/spatial"
import * as bbox from "@bokehjs/core/util/bbox"
import {range} from "@bokehjs/core/util/array"

describe("core/util/spatial module", () => {

  describe("empty SpatialIndex", () => {
    it("should support bounds()", () => {
      const index = new SpatialIndex(0)
      index.finish()
      expect(index.bounds(bbox.empty())).to.be.equal(bbox.empty())
      expect(index.bounds(bbox.full())).to.be.equal(bbox.empty())
      expect(index.bounds(bbox.positive_x())).to.be.equal(bbox.empty())
      expect(index.bounds(bbox.positive_y())).to.be.equal(bbox.empty())
      expect(index.bounds(bbox.negative_x())).to.be.equal(bbox.empty())
      expect(index.bounds(bbox.negative_y())).to.be.equal(bbox.empty())
      expect(index.bounds(bbox.x_range(-1.5, 2.8))).to.be.equal(bbox.empty())
      expect(index.bounds(bbox.y_range(-1.5, 2.8))).to.be.equal(bbox.empty())
      expect(index.bounds({x0: -10, y0: 2.3, x1: 1000.2, y1: 100})).to.be.equal(bbox.empty())
    })
  })

  describe("SpatialIndex from add_rect", () => {

    it("should support bounds() with full rect", () => {
      const index = new SpatialIndex(6)
      index.add_rect(0, 1, 1, 2)
      index.add_rect(0.0001, 1, 1, 2)
      index.add_rect(0, 100, 1, 200)
      index.add_rect(0.0001, -100, 1, 200)
      index.add_rect(0, 10, 1, 20)
      index.add_rect(-0.0001, 10, 1, 20)
      index.finish()
      expect(index.bounds(bbox.full())).to.be.equal({x0: -0.0001, x1: 1, y0: -100, y1: 200})
    })

    it("should support bounds() with empty rect", () => {
      const index = new SpatialIndex(6)
      index.add_rect(0, 1, 1, 2)
      index.add_rect(0.0001, 1, 1, 2)
      index.add_rect(0, 100, 1, 200)
      index.add_rect(0.0001, -100, 1, 200)
      index.add_rect(0, 10, 1, 20)
      index.add_rect(-0.0001, 10, 1, 20)
      index.finish()
      expect(index.bounds(bbox.empty())).to.be.equal(bbox.empty())
    })

    it("should support bounds() with positive_x rect", () => {
      const index = new SpatialIndex(6)
      index.add_rect(0, 1, 1, 2)
      index.add_rect(0.0001, 1, 1, 2)
      index.add_rect(0, 100, 1, 200)
      index.add_rect(0.0001, 100, 1, 200)
      index.add_rect(0, 10, 1, 20)
      index.add_rect(-0.0001, 10, 1, 20)
      index.finish()
      expect(index.bounds(bbox.positive_x())).to.be.equal({x0: 0.0001, x1: 1, y0: 1, y1: 200})
    })

    it("should support bounds() with negative_x rect", () => {
      const index = new SpatialIndex(6)
      index.add_rect(0, 1, 1, 2)
      index.add_rect(0.0001, 1, 1, 2)
      index.add_rect(0, 100, 1, 200)
      index.add_rect(0.0001, 100, 1, 200)
      index.add_rect(0, 10, 1, 20)
      index.add_rect(-1, 10, -0.0001, 20)
      index.finish()
      expect(index.bounds(bbox.negative_x())).to.be.equal({x0: -1, x1: -0.0001, y0: 10, y1: 20})
    })

    it("should support bounds() with positive_y rect", () => {
      const index = new SpatialIndex(6)
      index.add_rect(0, 1, 1, 2)
      index.add_rect(0.0001, 1, 1, 2)
      index.add_rect(0, 100, 1, 200)
      index.add_rect(0.0001, 100, 1, 200)
      index.add_rect(0, 10, 1, 20)
      index.add_rect(-0.0001, 10, 1, 20)
      index.finish()
      expect(index.bounds(bbox.positive_y())).to.be.equal({x0: -0.0001, x1: 1, y0: 1, y1: 200})
    })

    it("should support bounds() with negative_y rect", () => {
      const index = new SpatialIndex(6)
      index.add_rect(0, 1, 1, 2)
      index.add_rect(0.0001, 1, 1, 2)
      index.add_rect(0, 100, 1, 200)
      index.add_rect(0.0001, 100, 1, 200)
      index.add_rect(0, 10, 1, 20)
      index.add_rect(-0.0001, -10, 1, -2)
      index.finish()
      expect(index.bounds(bbox.negative_y())).to.be.equal({x0: -0.0001, x1: 1, y0: -10, y1: -2})
    })

    it("should support bounds() with x_range rect", () => {
      const index = new SpatialIndex(6)
      index.add_rect(0, 1, 1, 2)
      index.add_rect(1, 1, 2, 2)
      index.add_rect(0, 100, 1, 200)
      index.add_rect(0.2, 100, 1, 200)
      index.add_rect(4, 10, 5, 20)
      index.add_rect(-0.1, -10, 0.5, -2)
      index.finish()
      expect(index.bounds(bbox.x_range(1, 3))).to.be.equal({x0: 1, x1: 2, y0: 1, y1: 200})
      expect(index.bounds(bbox.x_range(1000, 2000))).to.be.equal(bbox.empty())
      expect(index.bounds(bbox.x_range(-2000, -1000))).to.be.equal(bbox.empty())
    })

    it("should support bounds() with y_range rect", () => {
      const index = new SpatialIndex(6)
      index.add_rect(0, 1, 1, 2)
      index.add_rect(1, 1, 2, 2)
      index.add_rect(0, 100, 1, 200)
      index.add_rect(0.2, 100, 1, 200)
      index.add_rect(4, 10, 5, 20)
      index.add_rect(-0.1, -10, 0.5, -2)
      index.finish()
      expect(index.bounds(bbox.y_range(-10, 3))).to.be.equal({x0: -0.1, x1: 2, y0: -10, y1: 2})
      expect(index.bounds(bbox.y_range(1000, 2000))).to.be.equal(bbox.empty())
      expect(index.bounds(bbox.y_range(-2000, -1000))).to.be.equal(bbox.empty())
    })

  })

  describe("SpatialIndex from add_point", () => {
    const index = new SpatialIndex(45)

    // origin
    index.add_point(0, 0)             // 0

    // axes
    index.add_point(0.0001, 0)        // 1
    index.add_point(-0.0001, 0)       // 2
    index.add_point(0, 0.0001)        // 3
    index.add_point(0, -0.0001)       // 4

    // positive x, positive y
    index.add_point(0.0001, 0.0001)   // 5
    index.add_point(1, 0.0001)        // 6
    index.add_point(10.1, 0.0001)     // 7
    index.add_point(0.0001, 1)        // 8
    index.add_point(1, 1)             // 9
    index.add_point(10.1, 1)          // 10
    index.add_point(0.0001, 10.1)     // 11
    index.add_point(1, 10.1)          // 12
    index.add_point(10.1, 10.1)       // 13
    index.add_point(11, 11)           // 14

    // positive x, negative y
    index.add_point(0.0001, -0.0001)   // 15
    index.add_point(1, -0.0001)        // 16
    index.add_point(10.1, -0.0001)     // 17
    index.add_point(0.0001, -1)        // 18
    index.add_point(1, -1)             // 19
    index.add_point(10.1, -1)          // 20
    index.add_point(0.0001, -10.1)     // 21
    index.add_point(1, -10.1)          // 22
    index.add_point(10.1, -10.1)       // 23
    index.add_point(11, -11)           // 24

    // negative x, positive y
    index.add_point(-0.0001, 0.0001)   // 25
    index.add_point(-1, 0.0001)        // 26
    index.add_point(-10.1, 0.0001)     // 27
    index.add_point(-0.0001, 1)        // 28
    index.add_point(-1, 1)             // 29
    index.add_point(-10.1, 1)          // 30
    index.add_point(-0.0001, 10.1)     // 31
    index.add_point(-1, 10.1)          // 32
    index.add_point(-10.1, 10.1)       // 33
    index.add_point(-11, 11)           // 34

    // negative x, negative y
    index.add_point(-0.0001, -0.0001)  // 35
    index.add_point(-1, -0.0001)       // 36
    index.add_point(-10.1, -0.0001)    // 37
    index.add_point(-0.0001, -1)       // 38
    index.add_point(-1, -1)            // 39
    index.add_point(-10.1, -1)         // 40
    index.add_point(-0.0001, -10.1)    // 41
    index.add_point(-1, -10.1)         // 42
    index.add_point(-10.1, -10.1)      // 43
    index.add_point(-11, -11)          // 44

    index.finish()

    it("should support indices with a full rect", () => {
      expect([...index.indices(bbox.full())]).to.be.equal(range(0, 45))
    })

    it("should support indices with an empty rect", () => {
      expect([...index.indices(bbox.empty())]).to.be.equal([])
    })

    it("should support indices with a positive_x rect", () => {
      expect([...index.indices(bbox.positive_x())]).to.be.equal([1, ...range(5, 25)])
    })

    it("should support indices with a positive_y rect", () => {
      expect([...index.indices(bbox.positive_y())]).to.be.equal([3, ...range(5, 15), ...range(25, 35)])
    })

    it("should support indices with a negative_x rect", () => {
      expect([...index.indices(bbox.negative_x())]).to.be.equal([2, ...range(25, 45)])
    })

    it("should support indices with a negative_y rect", () => {
      expect([...index.indices(bbox.negative_y())]).to.be.equal([4, ...range(15, 25), ...range(35, 45)])
    })

    it("should support indices with a x_range rect", () => {
      expect([...index.indices(bbox.x_range(0, 20))]).to.be.equal([0, 1, 3, 4, ...range(5, 25)])
      expect([...index.indices(bbox.x_range(20, 100))]).to.be.equal([])
      expect([...index.indices(bbox.x_range(-20, 0))]).to.be.equal([0, 2, 3, 4, ...range(25, 45)])
      expect([...index.indices(bbox.x_range(-100, -20))]).to.be.equal([])
      expect([...index.indices(bbox.x_range(-5, 5))]).to.be.equal([0, 1, 2, 3, 4, 5, 6, 8, 9, 11, 12, 15, 16, 18, 19, 21, 22, 25, 26, 28, 29, 31, 32, 35, 36, 38, 39, 41, 42])
    })

    it("should support indices with a y_range rect", () => {
      expect([...index.indices(bbox.y_range(0, 20))]).to.be.equal([0, 1, 2, 3, ...range(5, 15), ...range(25, 35)])
      expect([...index.indices(bbox.y_range(20, 100))]).to.be.equal([])
      expect([...index.indices(bbox.y_range(-20, 0))]).to.be.equal([0, 1, 2, 4, ...range(15, 25), ...range(35, 45)])
      expect([...index.indices(bbox.y_range(-100, -20))]).to.be.equal([])
      expect([...index.indices(bbox.y_range(-5, 5))]).to.be.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 25, 26, 27, 28, 29, 30, 35, 36, 37, 38, 39, 40])
    })

    it("should support indices with an arbitrary rect", () => {
      expect([...index.indices({x0: -12, y0: -12, x1: 12, y1: 12})]).to.be.equal(range(45))
      expect([...index.indices({x0: -5, y0: -5, x1: 5, y1: 5})]).to.be.equal([0, 1, 2, 3, 4, 5, 6, 8, 9, 15, 16, 18, 19, 25, 26, 28, 29, 35, 36, 38, 39])

      expect([...index.indices({x0: -5, y0: 0, x1: 5, y1: 5})]).to.be.equal([0, 1, 2, 3, 5, 6, 8, 9, 25, 26, 28, 29])
      expect([...index.indices({x0: -5, y0: -5, x1: 5, y1: 0})]).to.be.equal([0, 1, 2, 4, 15, 16, 18, 19, 35, 36, 38, 39])
      expect([...index.indices({x0: 0, y0: -5, x1: 5, y1: 5})]).to.be.equal([0, 1, 3, 4, 5, 6, 8, 9, 15, 16, 18, 19])
      expect([...index.indices({x0: -5, y0: -5, x1: 0, y1: 5})]).to.be.equal([0, 2, 3, 4, 25, 26, 28, 29, 35, 36, 38, 39])

      expect([...index.indices({x0: -5, y0: 1, x1: 5, y1: 5})]).to.be.equal([8, 9, 28, 29])
      expect([...index.indices({x0: -5, y0: -5, x1: 5, y1: -1})]).to.be.equal([18, 19, 38, 39])
      expect([...index.indices({x0: 1, y0: -5, x1: 5, y1: 5})]).to.be.equal([6, 9, 16, 19])
      expect([...index.indices({x0: -5, y0: -5, x1: -1, y1: 5})]).to.be.equal([26, 29, 36, 39])

      expect([...index.indices({x0: 12, y0: 12, x1: 20, y1: 20})]).to.be.equal([])
      expect([...index.indices({x0: 12, y0: -20, x1: 20, y1: -12})]).to.be.equal([])
      expect([...index.indices({x0: -20, y0: 12, x1: -12, y1: 20})]).to.be.equal([])
      expect([...index.indices({x0: -20, y0: -20, x1: -12, y1: -12})]).to.be.equal([])
    })

    it("should support bounds with a full rect", () => {
      expect(index.bounds(bbox.full())).to.be.equal({x0: -11, y0: -11, x1: 11, y1: 11})
    })

    it("should support bounds with a positive_x rect", () => {
      expect(index.bounds(bbox.positive_x())).to.be.equal({x0: 0.0001, y0: -11, x1: 11, y1: 11})
    })

    it("should support bounds with a positive_y rect", () => {
      expect(index.bounds(bbox.positive_y())).to.be.equal({x0: -11, y0: 0.0001, x1: 11, y1: 11})
    })

    it("should support bounds with a negative_x rect", () => {
      expect(index.bounds(bbox.negative_x())).to.be.equal({x0: -11, y0: -11, x1: -0.0001, y1: 11})
    })

    it("should support bounds with a negative_y rect", () => {
      expect(index.bounds(bbox.negative_y())).to.be.equal({x0: -11, y0: -11, x1: 11, y1: -0.0001})
    })

    it("should support bounds with a x_range rect", () => {
      expect(index.bounds(bbox.x_range(0, 20))).to.be.equal({x0: 0, y0: -11, x1: 11, y1: 11})
      expect(index.bounds(bbox.x_range(20, 100))).to.be.equal(bbox.empty())
      expect(index.bounds(bbox.x_range(-20, 0))).to.be.equal({x0: -11, y0: -11, x1: 0, y1: 11})
      expect(index.bounds(bbox.x_range(-100, -20))).to.be.equal(bbox.empty())
      expect(index.bounds(bbox.x_range(-5, 5))).to.be.equal({x0: -1, y0: -10.1, x1: 1, y1: 10.1})
    })

    it("should support bounds with a y_range rect", () => {
      expect(index.bounds(bbox.y_range(0, 20))).to.be.equal({x0: -11, y0: 0, x1: 11, y1: 11})
      expect(index.bounds(bbox.y_range(20, 100))).to.be.equal(bbox.empty())
      expect(index.bounds(bbox.y_range(-20, 0))).to.be.equal({x0: -11, y0: -11, x1: 11, y1: 0})
      expect(index.bounds(bbox.y_range(-100, -20))).to.be.equal(bbox.empty())
      expect(index.bounds(bbox.y_range(-5, 5))).to.be.equal({x0: -10.1, y0: -1, x1: 10.1, y1: 1})
    })

  })

})
