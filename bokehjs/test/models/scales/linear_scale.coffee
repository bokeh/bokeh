{expect} = require "chai"

{LinearScale} = require("models/scales/linear_scale")
{Range1d} = require("models/ranges/range1d")

describe "linear_scale module", ->
  source = {start: 0, end: 10}
  target = {start: 20, end: 80}

  generate_scale = ->
    new LinearScale({
      source_range: new Range1d(source)
      target_range: new Range1d(target)
    })

  describe "creation with Range1d ranges", ->
    scale = generate_scale()

    it "should compute scale state", ->
      expect(scale._compute_state()).to.be.deep.equal [6, 20]

    it "should map values linearly", ->
      expect(scale.compute(-1)).to.be.equal 14
      expect(scale.compute(0)).to.be.equal 20
      expect(scale.compute(5)).to.be.equal 50
      expect(scale.compute(10)).to.be.equal 80
      expect(scale.compute(11)).to.be.equal 86

    it "should vector map values linearly", ->
      expect(scale.v_compute([-1,0,5,10,11])).to.be.deep.equal new Float64Array [14,20,50,80,86]

    it "should map to a Float64Array", ->
      expect(scale.v_compute([-1,0,5,10,11])).to.be.instanceof Float64Array

    it "should inverse map values linearly", ->
      expect(scale.invert(14)).to.be.equal -1
      expect(scale.invert(20)).to.be.equal 0
      expect(scale.invert(50)).to.be.equal 5
      expect(scale.invert(80)).to.be.equal 10
      expect(scale.invert(86)).to.be.equal 11

    it "should vector in inverse map values linearly", ->
      expect(scale.v_invert([14,20,50,80,86])).to.be.deep.equal new Float64Array [-1,0,5,10,11]

    it "should inverse map to a Float64Array", ->
      expect(scale.v_invert([-1,0,5,10,11])).to.be.instanceof Float64Array
