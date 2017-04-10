{expect} = require "chai"
utils = require "../../utils"

{LogMapper} = utils.require("models/mappers/log_mapper")
{Range1d} = utils.require("models/ranges/range1d")

describe "LogMapper module", ->

  beforeEach ->
    @mapper = new LogMapper({
      source_range: new Range1d({start: 1, end: 10000})
      target_range: new Range1d({start: 10, end: 110})
    })

  describe "_mapper_state method", ->

    it "should correctly compute the mapper state", ->
      mapper_state = @mapper._mapper_state()
      expect(mapper_state).to.be.deep.equal [ 100, 10, 9.210340371976184, 0 ]

  describe "map_to_target method", ->

    it "should clamp values to source range", ->
      expect(@mapper.map_to_target(1)).to.be.equal 10
      expect(@mapper.map_to_target(0)).to.be.equal 10

      expect(@mapper.map_to_target(10000)).to.be.equal 110
      expect(@mapper.map_to_target(10001)).to.be.equal 110

    it "should map NaN values to NaN", ->
      expect(@mapper.map_to_target(NaN)).to.be.NaN

    it "should map infinity values to NaN", ->
      @mapper.source_range.start = 0
      expect(@mapper.map_to_target(0)).to.be.NaN

    it "should map values > start logly", ->
      expect(@mapper.map_to_target(1)).to.be.equal 10
      expect(@mapper.map_to_target(10)).to.be.equal 35
      expect(@mapper.map_to_target(100)).to.be.equal 60
      expect(@mapper.map_to_target(10000)).to.be.equal 110

  describe "v_map_to_target method", ->

    it "should clamp values to source range", ->
      expect(@mapper.v_map_to_target([0, 1])).to.be.deep.equal(new Float64Array([10, 10]))
      expect(@mapper.v_map_to_target([10000, 10001])).to.be.deep.equal(new Float64Array([110, 110]))

    it "should vector map NaN values to NaN", ->
      expect(@mapper.v_map_to_target([NaN])).to.be.deep.equal(new Float64Array([NaN]))

    it "should vector map infinity values to NaN", ->
      @mapper.source_range.start = 0
      expect(@mapper.v_map_to_target([0])).to.be.deep.equal(new Float64Array([NaN]))

    it "should vector map values logly", ->
      expect(@mapper.v_map_to_target([1,10,100,10000])).to.be.deep.equal new Float64Array [10, 35, 60, 110]

    it "should map to a Float64Array", ->
      expect(@mapper.v_map_to_target([-1,0,5,10,11])).to.be.instanceof Float64Array

  describe "map_from_target method", ->

    it "should inverse map values logly", ->
      expect(@mapper.map_from_target(-15)).to.be.equal 0.09999999999999996
      expect(@mapper.map_from_target(10)).to.be.equal 1
      expect(@mapper.map_from_target(35)).to.be.equal 10.000000000000004
      expect(@mapper.map_from_target(60)).to.be.equal 100.00000000000007
      expect(@mapper.map_from_target(85)).to.be.equal 1000.0000000000014
      expect(@mapper.map_from_target(110)).to.be.equal 10000.000000000007

  describe "v_map_from_target method", ->

    it "should vector map inverse map values logly", ->
      expect(@mapper.v_map_from_target([-15, 10, 35, 60, 85, 110])).to.be.deep.equal new Float64Array [0.09999999999999996, 1, 10.000000000000004, 100.00000000000007, 1000.0000000000014, 10000.000000000007]

    it "should inverse map to a Float64Array", ->
      expect(@mapper.v_map_from_target([-1,0,5,10,11])).to.be.instanceof Float64Array

    describe "update source range1d", ->

      it "should update on whole range replacement", ->
        @mapper.source_range = new Range1d({start: -10, end: 20})
        expect(@mapper.mapper_state).to.be.deep.equal [ 100, 10, 2.995732273553991, 0 ]

      it "should update on range start update", ->
        @mapper.source_range.start = -10
        expect(@mapper.mapper_state).to.be.deep.equal [ 100, 10, 9.210340371976184, 0 ]

      it "should update on range end update", ->
        @mapper.source_range.end = 20
        expect(@mapper.mapper_state).to.be.deep.equal [ 100, 10, 2.995732273553991, 0 ]

    describe "update target range1d", ->

      it "should update on whole range replacement", ->
        @mapper.target_range = new Range1d({start: 0, end: 100})
        expect(@mapper.mapper_state).to.be.deep.equal [ 100, 0, 9.210340371976184, 0 ]

      it "should update on range start update", ->
        @mapper.target_range.start = 0
        expect(@mapper.mapper_state).to.be.deep.equal [ 110, 0, 9.210340371976184, 0 ]

      it "should update on range end update", ->
        @mapper.target_range.end = 100
        expect(@mapper.mapper_state).to.be.deep.equal [ 90, 10, 9.210340371976184, 0 ]
