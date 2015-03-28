{expect} = require "chai"
utils = require "../utils"

base = utils.require "common/base"
{Collections} = base

describe "linear_mapper module", ->
  source = {start: 0, end: 10}
  target = {start: 20, end: 80}

  generate_mapper = ->
    Collections("LinearMapper").create
      source_range: Collections("Range1d").create source
      target_range: Collections("Range1d").create target

  describe "creation with Range1d ranges", ->
    mapper = generate_mapper()

    it "should compute mapper state", ->
      expect(mapper.get('mapper_state')).to.be.deep.equal [6, 20]

    it "should map values linearly", ->
      expect(mapper.map_to_target(-1)).to.be.equal 14
      expect(mapper.map_to_target(0)).to.be.equal 20
      expect(mapper.map_to_target(5)).to.be.equal 50
      expect(mapper.map_to_target(10)).to.be.equal 80
      expect(mapper.map_to_target(11)).to.be.equal 86

    it "should vector map values linearly", ->
      expect(mapper.v_map_to_target([-1,0,5,10,11])).to.be.deep.equal new Float64Array [14,20,50,80,86]

    it "should map to a Float64Array", ->
      expect(mapper.v_map_to_target([-1,0,5,10,11])).to.be.instanceof Float64Array

    it "should inverse map values linearly", ->
      expect(mapper.map_from_target(14)).to.be.equal -1
      expect(mapper.map_from_target(20)).to.be.equal 0
      expect(mapper.map_from_target(50)).to.be.equal 5
      expect(mapper.map_from_target(80)).to.be.equal 10
      expect(mapper.map_from_target(86)).to.be.equal 11

    it "should vector in inverse map values linearly", ->
      expect(mapper.v_map_from_target([14,20,50,80,86])).to.be.deep.equal new Float64Array [-1,0,5,10,11]

    it "should inverse map to a Float64Array", ->
      expect(mapper.v_map_from_target([-1,0,5,10,11])).to.be.instanceof Float64Array

    describe "update source range1d", ->

      it "should update on whole range replacement", ->
        mapper = generate_mapper()
        mapper.set('source_range', Collections("Range1d").create {start: -10, end: 20})
        expect(mapper.get('mapper_state')).to.be.deep.equal [2, 40]

      it "should update on range start update", ->
        mapper = generate_mapper()
        mapper.get('source_range').set('start', -10)
        expect(mapper.get('mapper_state')).to.be.deep.equal [3, 50]

      it "should update on range end update", ->
        mapper = generate_mapper()
        mapper.get('source_range').set('end', 20)
        expect(mapper.get('mapper_state')).to.be.deep.equal [3, 20]

    describe "update target range1d", ->

      it "should update on whole range replacement", ->
        mapper = generate_mapper()
        mapper.set('target_range', Collections("Range1d").create {start: 0, end: 100})
        expect(mapper.get('mapper_state')).to.be.deep.equal [10, 0]

      it "should update on range start update", ->
        mapper = generate_mapper()
        mapper.get('target_range').set('start', 0)
        expect(mapper.get('mapper_state')).to.be.deep.equal [8, 0]

      it "should update on range end update", ->
        mapper = generate_mapper()
        mapper.get('target_range').set('end', 100)
        expect(mapper.get('mapper_state')).to.be.deep.equal [8, 20]
