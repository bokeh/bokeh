{expect} = require "chai"
utils = require "../utils"

base = utils.require "common/base"
{Collections} = base

describe "log_mapper module", ->
  source = {start: 0, end: 10000}
  target = {start: 10, end: 110}

  generate_mapper = ->
    Collections("LogMapper").create
      source_range: Collections("Range1d").create source
      target_range: Collections("Range1d").create target

  describe "creation with Range1d ranges", ->
    mapper = generate_mapper()

    it "should compute mapper state", ->
      expect(mapper.get('mapper_state')).to.be.deep.equal [ 100, 10, 9.210340371976184, 0 ]

    it "should map values <= start to start", ->
      expect(mapper.map_to_target(0)).to.be.equal 10
      expect(mapper.map_to_target(-1)).to.be.equal 10

    it "should map values > start logly", ->
      expect(mapper.map_to_target(10)).to.be.equal 35
      expect(mapper.map_to_target(100)).to.be.equal 60
      expect(mapper.map_to_target(1000)).to.be.equal 84.99999999999999
      expect(mapper.map_to_target(10000)).to.be.equal 110
      expect(mapper.map_to_target(100000)).to.be.equal 135

    it "should vector map values logly", ->
      expect(mapper.v_map_to_target([0,10,100,10000])).to.be.deep.equal new Float64Array [10, 35, 60, 110]

    it "should map to a Float64Array", ->
      expect(mapper.v_map_to_target([-1,0,5,10,11])).to.be.instanceof Float64Array

    it "should inverse map values logly", ->
      expect(mapper.map_from_target(-15)).to.be.equal 0.09999999999999996
      expect(mapper.map_from_target(10)).to.be.equal 1
      expect(mapper.map_from_target(35)).to.be.equal 10.000000000000004
      expect(mapper.map_from_target(60)).to.be.equal 100.00000000000007
      expect(mapper.map_from_target(85)).to.be.equal 1000.0000000000014
      expect(mapper.map_from_target(110)).to.be.equal 10000.000000000007

    it "should vector map inverse map values logly", ->
      expect(mapper.v_map_from_target([-15, 10, 35, 60, 85, 110])).to.be.deep.equal new Float64Array [0.09999999999999996, 1, 10.000000000000004, 100.00000000000007, 1000.0000000000014, 10000.000000000007]

    it "should inverse map to a Float64Array", ->
      expect(mapper.v_map_from_target([-1,0,5,10,11])).to.be.instanceof Float64Array

    describe "update source range1d", ->

      it "should update on whole range replacement", ->
        mapper = generate_mapper()
        mapper.set('source_range', Collections("Range1d").create {start: -10, end: 20})
        expect(mapper.get('mapper_state')).to.be.deep.equal [ 100, 10, 2.995732273553991, 0 ]

      it "should update on range start update", ->
        mapper = generate_mapper()
        mapper.get('source_range').set('start', -10)
        expect(mapper.get('mapper_state')).to.be.deep.equal [ 100, 10, 9.210340371976184, 0 ]

      it "should update on range end update", ->
        mapper = generate_mapper()
        mapper.get('source_range').set('end', 20)
        expect(mapper.get('mapper_state')).to.be.deep.equal [ 100, 10, 2.995732273553991, 0 ]

    describe "update target range1d", ->

      it "should update on whole range replacement", ->
        mapper = generate_mapper()
        mapper.set('target_range', Collections("Range1d").create {start: 0, end: 100})
        expect(mapper.get('mapper_state')).to.be.deep.equal [ 100, 0, 9.210340371976184, 0 ]

      it "should update on range start update", ->
        mapper = generate_mapper()
        mapper.get('target_range').set('start', 0)
        expect(mapper.get('mapper_state')).to.be.deep.equal [ 110, 0, 9.210340371976184, 0 ]

      it "should update on range end update", ->
        mapper = generate_mapper()
        mapper.get('target_range').set('end', 100)
        expect(mapper.get('mapper_state')).to.be.deep.equal [ 90, 10, 9.210340371976184, 0 ]
