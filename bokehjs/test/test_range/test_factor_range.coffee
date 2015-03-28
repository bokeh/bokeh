{expect} = require "chai"
utils = require "../utils"

base = utils.require "common/base"
{Collections} = base

describe "factor_range module", ->

  describe "default creation", ->
    r = Collections('FactorRange').create()

    it "should have empty factors", ->
      expect(r.get('factors')).to.be.deep.equal []

  describe "min/max properties", ->
    r = Collections('FactorRange').create()

    it "should return values from synthetic range", ->
      r.set('factors', ['FOO'])

      expect(r.get('min')).to.be.equal 0.5
      expect(r.get('max')).to.be.equal 1.5

    it "should update when factors update", ->
      r.set('factors', ['FOO', 'BAR'])

      expect(r.get('min')).to.be.equal 0.5
      expect(r.get('max')).to.be.equal 2.5

      r.set('factors', ['A', 'B', 'C'])

      expect(r.get('min')).to.be.equal 0.5
      expect(r.get('max')).to.be.equal 3.5