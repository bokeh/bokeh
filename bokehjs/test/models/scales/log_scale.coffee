{expect} = require "chai"

{LogScale} = require("models/scales/log_scale")
{Range1d} = require("models/ranges/range1d")

describe "LogScale module", ->

  beforeEach ->
    @scale = new LogScale({
      source_range: new Range1d({start: 1, end: 10000})
      target_range: new Range1d({start: 10, end: 110})
    })

  describe "_compute_state method", ->

    it "should correctly compute the scale state", ->
      expect(@scale._compute_state()).to.be.deep.equal [ 100, 10, 9.210340371976184, 0 ]

  describe "compute method", ->

    it "should map NaN values to NaN", ->
      expect(@scale.compute(NaN)).to.be.NaN

    it "should map infinity values to NaN", ->
      @scale.source_range.start = 0
      expect(@scale.compute(0)).to.be.NaN

    it "should map values > start logly", ->
      expect(@scale.compute(1)).to.be.equal 10
      expect(@scale.compute(10)).to.be.equal 35
      expect(@scale.compute(100)).to.be.equal 60
      expect(@scale.compute(10000)).to.be.equal 110

  describe "v_compute method", ->

    it "should vector map NaN values to NaN", ->
      expect(@scale.v_compute([NaN])).to.be.deep.equal(new Float64Array([NaN]))

    it "should vector map infinity values to NaN", ->
      @scale.source_range.start = 0
      expect(@scale.v_compute([0])).to.be.deep.equal(new Float64Array([NaN]))

    it "should vector map values logly", ->
      expect(@scale.v_compute([1,10,100,10000])).to.be.deep.equal new Float64Array [10, 35, 60, 110]

    it "should map to a Float64Array", ->
      expect(@scale.v_compute([-1,0,5,10,11])).to.be.instanceof Float64Array

  describe "invert method", ->

    it "should inverse map values logly", ->
      expect(@scale.invert(-15)).to.be.closeTo(0.1, 1e-10)
      expect(@scale.invert(10)).to.be.closeTo(1, 1e-10)
      expect(@scale.invert(35)).to.be.closeTo(10, 1e-10)
      expect(@scale.invert(60)).to.be.closeTo(100, 1e-10)
      expect(@scale.invert(85)).to.be.closeTo(1000, 1e-10)
      expect(@scale.invert(110)).to.be.closeTo(10000, 1e-10)

  describe "v_invert method", ->

    it "should vector map inverse map values logly", ->
      value = @scale.v_invert([-15, 10, 35, 60, 85, 110])

      expect(value).to.be.instanceof(Float64Array)
      expect(value.length).to.be.equal(6)

      expect(value[0]).to.be.closeTo(0.1, 1e-10)
      expect(value[1]).to.be.closeTo(1, 1e-10)
      expect(value[2]).to.be.closeTo(10, 1e-10)
      expect(value[3]).to.be.closeTo(100, 1e-10)
      expect(value[4]).to.be.closeTo(1000, 1e-10)
      expect(value[5]).to.be.closeTo(10000, 1e-10)
