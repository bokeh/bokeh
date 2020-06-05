import {expect} from "assertions"

import * as math from "@bokehjs/core/util/math"

const {PI} = Math

describe("math module", () => {

  describe("angle_norm", () => {

    it("should return 0 for 0", () => {
      expect(math.angle_norm(0)).to.be.equal(0)

    })

    it("should return angle normalized between 0 and 2*PI inclusive", () => {
      expect(math.angle_norm(3*PI)).to.be.similar(PI)
      expect(math.angle_norm(-3*PI)).to.be.similar(PI)
    })

    it("should return 2*PI for -2*PI", () => {
      expect(math.angle_norm(2*PI)).to.be.similar(2*PI)
    })

  })

  describe("angle_dist", () => {

    it("should return the distance between two angles as a positive radian", () => {
      expect(math.angle_dist(2.5*PI, -2.5*PI)).to.be.similar(PI)
      expect(math.angle_dist(-2.5*PI, 2.5*PI)).to.be.similar(PI)
    })

    it("should return 2*PI for  full range", () => {
      expect(math.angle_dist(0, 2*PI)).to.be.similar(2*PI)
      expect(math.angle_dist(2*PI, 0)).to.be.similar(2*PI)
    })

  })

  describe("angle_between", () => {

    it("should return true if `mid` angle strictly between `lhs` and `rhs`", () => {
      expect(math.angle_between(0, -1, 1, 1)).to.be.true
      expect(math.angle_between(0, -1, 1, 0)).to.be.false
    })

    it("should return false if `mid` == `lhs` == `rhs`", () => {
      expect(math.angle_between(10, 10, 10, 1)).to.be.false
      expect(math.angle_between(10, 10, 10, 0)).to.be.false
    })

    it("should return false if `lhs` == `rhs` == 0", () => {
      expect(math.angle_between(0, 0, 0, 0)).to.be.false
      expect(math.angle_between(1, 0, 0, 0)).to.be.false
      expect(math.angle_between(-1, 0, 0, 0)).to.be.false
      expect(math.angle_between(0, 0, 0, 1)).to.be.false
      expect(math.angle_between(1, 0, 0, 1)).to.be.false
      expect(math.angle_between(-1, 0, 0, 1)).to.be.false
    })

    it("should return true if angle dist is 2_PI", () => {
      expect(math.angle_between(1, 0, 2*PI, 0)).to.be.true
      expect(math.angle_between(-1, 0, 2*PI, 0)).to.be.true
      expect(math.angle_between(1, 0, 2*PI, 1)).to.be.true
      expect(math.angle_between(-1, 0, 2*PI, 1)).to.be.true
    })

  })

  describe("atan2", () => {

    it("should return the arctangent between 2 (x,y) points", () => {
      expect(math.atan2([0, 0], [0, 1])).to.be.similar(PI/2) // vertical up
      expect(math.atan2([0, 0], [0, -1])).to.be.similar(-PI/2) // vertical down
      expect(math.atan2([0, 0], [1, 0])).to.be.similar(0) // horizontal right
      expect(math.atan2([0, 0], [-1, 0])).to.be.similar(PI) // horizontal left
      expect(math.atan2([1, 1], [2, 2])).to.be.similar(PI/4)
    })

  })

  describe("clamp", () => {

    it("should clamp between min and max values", () => {
      expect(math.clamp(0, -1, 1)).to.be.equal(0)
      expect(math.clamp(1, -1, 1)).to.be.equal(1)
      expect(math.clamp(2, -1, 1)).to.be.equal(1)
      expect(math.clamp(-1, -1, 1)).to.be.equal(-1)
      expect(math.clamp(-2, -1, 1)).to.be.equal(-1)

      expect(math.clamp(0, 1, 2)).to.be.equal(1)
      expect(math.clamp(1, 1, 2)).to.be.equal(1)
      expect(math.clamp(-1, 1, 2)).to.be.equal(1)
      expect(math.clamp(1.5, 1, 2)).to.be.equal(1.5)
      expect(math.clamp(2, 1, 2)).to.be.equal(2)
      expect(math.clamp(3, 1, 2)).to.be.equal(2)
    })

  })
})
