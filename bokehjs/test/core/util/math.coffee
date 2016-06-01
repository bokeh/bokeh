{expect} = require "chai"
utils = require "../../utils"

math = utils.require("core/util/math")

describe "math module", ->

  array_neg = [-2, -1, 0, 1, 2]
  array_dbl = [0, 0, 1, 1, 2, 2]

  it "should return min value of array", ->
    expect(math.array_min(array_neg)).to.eql(-2)
    expect(math.array_min(array_dbl)).to.eql(0)

  it "should return max value of array", ->
    expect(math.array_max(array_neg)).to.eql(2)
    expect(math.array_max(array_dbl)).to.eql(2)

  it "should return angle normalized between 0 and 2*Math.PI inclusive", ->
    expect(math.angle_norm(3*Math.PI)).to.be.closeTo(Math.PI, 0.000001)
    expect(math.angle_norm(-3*Math.PI)).to.be.closeTo(Math.PI, 0.000001)
    expect(math.angle_norm(0)).to.be.closeTo(0, 0.000001)

  it "should return the distance between two angles as a positive radian", ->
    expect(math.angle_dist(2.5*Math.PI, -2.5*Math.PI)).to.be.closeTo(Math.PI, 0.000001)
    expect(math.angle_dist(-2.5*Math.PI, 2.5*Math.PI)).to.be.closeTo(Math.PI, 0.000001)

  it "should return true if `mid` angle between `lhs` and `rhs`", ->
    expect(math.angle_between(0, -1, 1, "anticlock")).to.be.equal(false)
    expect(math.angle_between(0, -1, 1, "clock")).to.be.equal(true)

  it "should return the arctangent between 2 (x,y) points", ->
    expect(math.atan2([0,0],[0,1])).to.be.closeTo(Math.PI/2, 0.0000001) # vertical up
    expect(math.atan2([0,0],[0,-1])).to.be.closeTo(-Math.PI/2, 0.0000001) # vertical down
    expect(math.atan2([0,0],[1,0])).to.be.closeTo(0, 0.0000001) # horizontal right
    expect(math.atan2([0,0],[-1,0])).to.be.closeTo(Math.PI, 0.0000001) # horizontal left
    expect(math.atan2([1,1],[2,2])).to.be.closeTo(Math.PI/4, 0.0000001)
