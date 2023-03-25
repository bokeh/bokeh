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
      expect(math.angle_between(0, -1, 1, true)).to.be.true
      expect(math.angle_between(0, -1, 1, false)).to.be.false
    })

    it("should return false if `mid` == `lhs` == `rhs`", () => {
      expect(math.angle_between(10, 10, 10, true)).to.be.false
      expect(math.angle_between(10, 10, 10, false)).to.be.false
    })

    it("should return false if `lhs` == `rhs` == 0", () => {
      expect(math.angle_between(0, 0, 0, false)).to.be.false
      expect(math.angle_between(1, 0, 0, false)).to.be.false
      expect(math.angle_between(-1, 0, 0, false)).to.be.false
      expect(math.angle_between(0, 0, 0, true)).to.be.false
      expect(math.angle_between(1, 0, 0, true)).to.be.false
      expect(math.angle_between(-1, 0, 0, true)).to.be.false
    })

    it("should return true if angle dist is 2_PI", () => {
      expect(math.angle_between(1, 0, 2*PI, false)).to.be.true
      expect(math.angle_between(-1, 0, 2*PI, false)).to.be.true
      expect(math.angle_between(1, 0, 2*PI, true)).to.be.true
      expect(math.angle_between(-1, 0, 2*PI, true)).to.be.true
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

  it("should support factorial()", () => {
    expect(math.factorial(0)).to.be.equal(1)
    expect(math.factorial(1)).to.be.equal(1)
    expect(math.factorial(2)).to.be.equal(2)
    expect(math.factorial(3)).to.be.equal(6)
    expect(math.factorial(4)).to.be.equal(24)
    expect(math.factorial(5)).to.be.equal(120)
    expect(math.factorial(6)).to.be.equal(720)
    expect(math.factorial(7)).to.be.equal(5040)
    expect(math.factorial(8)).to.be.equal(40320)
    expect(math.factorial(9)).to.be.equal(362880)
  })

  it("should support hermite()", () => {
    expect(math.hermite(0)).to.be.equal([1])
    expect(math.hermite(1)).to.be.equal([2, 0])
    expect(math.hermite(2)).to.be.equal([4, 0, -2])
    expect(math.hermite(3)).to.be.equal([8, 0, -12, 0])
    expect(math.hermite(4)).to.be.equal([16, 0, -48, 0, 12])
    expect(math.hermite(5)).to.be.equal([32, 0, -160, 0, 120, 0])
    expect(math.hermite(6)).to.be.equal([64, 0, -480, 0, 720, 0, -120])
    expect(math.hermite(7)).to.be.equal([128, 0, -1344, 0, 3360, 0, -1680, 0])
    expect(math.hermite(8)).to.be.equal([256, 0, -3584, 0, 13440, 0, -13440, 0, 1680])
    expect(math.hermite(9)).to.be.equal([512, 0, -9216, 0, 48384, 0, -80640, 0, 30240, 0])
  })

  it("should support poly_eval()", () => {
    const poly = math.hermite(5)
    expect(math.eval_poly(poly, 0)).to.be.equal(0)
    expect(math.eval_poly(poly, 1)).to.be.equal(-8)
    expect(math.eval_poly(poly, 2)).to.be.equal(-16)
    expect(math.eval_poly(poly, 3)).to.be.equal(3816)
    expect(math.eval_poly(poly, 4)).to.be.equal(23008)
    expect(math.eval_poly(poly, 5)).to.be.equal(80600)
    expect(math.eval_poly(poly, 6)).to.be.equal(214992)
    expect(math.eval_poly(poly, 7)).to.be.equal(483784)
    expect(math.eval_poly(poly, 8)).to.be.equal(967616)
    expect(math.eval_poly(poly, 9)).to.be.equal(1774008)
  })
})
