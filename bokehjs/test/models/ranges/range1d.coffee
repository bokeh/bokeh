{expect} = require "chai"
utils = require "../../utils"

Range1d = utils.require("models/ranges/range1d").Model

describe "range1d module", ->

  describe "default creation", ->
    r = new Range1d()

    it "should have start = 0", ->
      expect(r.get('start')).to.be.equal 0

    it "should have end = 1", ->
      expect(r.get('end')).to.be.equal 1

    it "should have min = 0", ->
      expect(r.get('min')).to.be.equal 0

    it "should have max = 1", ->
      expect(r.get('max')).to.be.equal 1

  describe "update start, less than end", ->
    r = new Range1d()
    r.set('start', -1)

    it "should have min = -1", ->
      expect(r.get('min')).to.be.equal -1

    it "should have max = 1", ->
      expect(r.get('max')).to.be.equal 1

  describe "update start, greater than end", ->
    r = new Range1d()
    r.set('start', 2)

    it "should have min = 1", ->
      expect(r.get('min')).to.be.equal 1

    it "should have max = 2", ->
      expect(r.get('max')).to.be.equal 2

  describe "update end, greater than start", ->
    r = new Range1d()
    r.set('end', 2)

    it "should have min = 0", ->
      expect(r.get('min')).to.be.equal 0

    it "should have max = 2", ->
      expect(r.get('max')).to.be.equal 2

  describe "update end, less than start", ->
    r = new Range1d()
    r.set('end', -1.1)

    it "should have min = -1.1", ->
      expect(r.get('min')).to.be.equal -1.1

    it "should have max = 0", ->
      expect(r.get('max')).to.be.equal 0

  describe "update both, positive", ->
    r = new Range1d()
    r.set('end', 1.1)
    r.set('start', 2.1)

    it "should have min = 1.1", ->
      expect(r.get('min')).to.be.equal 1.1

    it "should have max = 2.1", ->
      expect(r.get('max')).to.be.equal 2.1

  describe "update both, negative", ->
    r = new Range1d()
    r.set('end', -1.1)
    r.set('start', -2.1)

    it "should have min = -2.1", ->
      expect(r.get('min')).to.be.equal -2.1

    it "should have max = -1.1", ->
      expect(r.get('max')).to.be.equal -1.1

  describe "reset", ->

    it "should reset to initial values", ->
      r = new Range1d({start: 10, end: 20})
      r.set('end', -1.1)
      r.set('start', -2.1)
      r.reset()
      expect(r.get('start')).to.be.equal 10
      expect(r.get('end')).to.be.equal 20
