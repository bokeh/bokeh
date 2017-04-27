{expect} = require "chai"
utils = require "../../utils"

{LinearScale} = utils.require("models/scales/linear_scale")
{Range1d} = utils.require("models/ranges/range1d")

describe "linear_mapper module", ->
  source = {start: 0, end: 10}
  target = {start: 20, end: 80}

  generate_mapper = ->
    new LinearScale({
      source_range: new Range1d(source)
      target_range: new Range1d(target)
    })

  describe "creation with Range1d ranges", ->
    mapper = generate_mapper()

    it "should compute mapper state", ->
      expect(mapper.state).to.be.deep.equal [6, 20]

    it "should map values linearly", ->
      expect(mapper.compute(-1)).to.be.equal 14
      expect(mapper.compute(0)).to.be.equal 20
      expect(mapper.compute(5)).to.be.equal 50
      expect(mapper.compute(10)).to.be.equal 80
      expect(mapper.compute(11)).to.be.equal 86

    it "should vector map values linearly", ->
      expect(mapper.v_compute([-1,0,5,10,11])).to.be.deep.equal new Float64Array [14,20,50,80,86]

    it "should map to a Float64Array", ->
      expect(mapper.v_compute([-1,0,5,10,11])).to.be.instanceof Float64Array

    it "should inverse map values linearly", ->
      expect(mapper.invert(14)).to.be.equal -1
      expect(mapper.invert(20)).to.be.equal 0
      expect(mapper.invert(50)).to.be.equal 5
      expect(mapper.invert(80)).to.be.equal 10
      expect(mapper.invert(86)).to.be.equal 11

    it "should vector in inverse map values linearly", ->
      expect(mapper.v_invert([14,20,50,80,86])).to.be.deep.equal new Float64Array [-1,0,5,10,11]

    it "should inverse map to a Float64Array", ->
      expect(mapper.v_invert([-1,0,5,10,11])).to.be.instanceof Float64Array

    describe "update source range1d", ->

      it "should update on whole range replacement", ->
        mapper = generate_mapper()
        mapper.source_range = new Range1d({start: -10, end: 20})
        expect(mapper.state).to.be.deep.equal [2, 40]

      it "should update on range start update", ->
        mapper = generate_mapper()
        mapper.source_range.start = -10
        expect(mapper.state).to.be.deep.equal [3, 50]

      it "should update on range end update", ->
        mapper = generate_mapper()
        mapper.source_range.end = 20
        expect(mapper.state).to.be.deep.equal [3, 20]

    describe "update target range1d", ->

      it "should update on whole range replacement", ->
        mapper = generate_mapper()
        mapper.target_range = new Range1d({start: 0, end: 100})
        expect(mapper.state).to.be.deep.equal [10, 0]

      it "should update on range start update", ->
        mapper = generate_mapper()
        mapper.target_range.start = 0
        expect(mapper.state).to.be.deep.equal [8, 0]

      it "should update on range end update", ->
        mapper = generate_mapper()
        mapper.target_range.end = 100
        expect(mapper.state).to.be.deep.equal [8, 20]
