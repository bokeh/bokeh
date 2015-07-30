{expect} = require "chai"
utils = require "../utils"

base = utils.require "common/base"
{Collections} = base

describe "factor_range module", ->

  describe "default creation", ->
    r = Collections('FactorRange').create()

    it "should have empty factors", ->
      expect(r.get('factors')).to.be.deep.equal []

    it "should have start=0.5", ->
      expect(r.get('start')).to.be.equal 0.5

    it "should have offset=0.0", ->
      expect(r.get('offset')).to.be.equal 0.0

  describe "min/max properties", ->
    r = Collections('FactorRange').create({factors: ['FOO']})

    it "should return values from synthetic range", ->

      expect(r.get('min')).to.be.equal 0.5
      expect(r.get('max')).to.be.equal 1.5

    it "should update when factors update", ->
      r.set('factors', ['FOO', 'BAR'])

      expect(r.get('min')).to.be.equal 0.5
      expect(r.get('max')).to.be.equal 2.5

      r.set('factors', ['A', 'B', 'C'])

      expect(r.get('min')).to.be.equal 0.5
      expect(r.get('max')).to.be.equal 3.5

    it "min should equal start", ->
      expect(r.get('min')).to.be.equal r.get('start')

    it "max should equal end", ->
      expect(r.get('max')).to.be.equal r.get('end')

  describe "offset property", ->
    r = Collections('FactorRange').create({factors: ['FOO'], offset: -1})

    it "should be applied to other properties", ->

      expect(r.get('min')).to.be.equal -0.5
      expect(r.get('max')).to.be.equal 0.5

      expect(r.get('start')).to.be.equal -0.5
      expect(r.get('end')).to.be.equal 0.5

  describe "start/end properties", ->
    r = Collections('FactorRange').create({factors: ['FOO']})

    it "should update when offset updates", ->
      r.set('offset', -1)

      expect(r.get('start')).to.be.equal -0.5
      expect(r.get('end')).to.be.equal 0.5


