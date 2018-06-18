import {expect} from "chai"

import * as math from "core/util/math"

describe("math module", () => {

  it("should return angle normalized between 0 and 2*Math.PI inclusive", () => {
    expect(math.angle_norm(3*Math.PI)).to.be.closeTo(Math.PI, 0.000001)
    expect(math.angle_norm(-3*Math.PI)).to.be.closeTo(Math.PI, 0.000001)
    expect(math.angle_norm(0)).to.be.closeTo(0, 0.000001)
  })

  it("should return the distance between two angles as a positive radian", () => {
    expect(math.angle_dist(2.5*Math.PI, -2.5*Math.PI)).to.be.closeTo(Math.PI, 0.000001)
    expect(math.angle_dist(-2.5*Math.PI, 2.5*Math.PI)).to.be.closeTo(Math.PI, 0.000001)
  })

  it("should return true if `mid` angle between `lhs` and `rhs`", () => {
    expect(math.angle_between(0, -1, 1, 1)).to.be.equal(true)
    expect(math.angle_between(0, -1, 1, 0)).to.be.equal(false)
  })

  it("should return the arctangent between 2 (x,y) points", () => {
    expect(math.atan2([0,0],[0,1])).to.be.closeTo(Math.PI/2, 0.0000001) // vertical up
    expect(math.atan2([0,0],[0,-1])).to.be.closeTo(-Math.PI/2, 0.0000001) // vertical down
    expect(math.atan2([0,0],[1,0])).to.be.closeTo(0, 0.0000001) // horizontal right
    expect(math.atan2([0,0],[-1,0])).to.be.closeTo(Math.PI, 0.0000001) // horizontal left
    expect(math.atan2([1,1],[2,2])).to.be.closeTo(Math.PI/4, 0.0000001)
  })

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
