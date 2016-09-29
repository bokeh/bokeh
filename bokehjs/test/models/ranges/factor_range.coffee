{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

CustomJS = utils.require("models/callbacks/customjs").Model
FactorRange = utils.require("models/ranges/factor_range").Model

describe "factor_range module", ->

  describe "default creation", ->
    r = new FactorRange()

    it "should have empty factors", ->
      expect(r.factors).to.be.deep.equal []

    it "should have start=0.5", ->
      expect(r.start).to.be.equal 0.5

    it "should have offset=0.0", ->
      expect(r.offset).to.be.equal 0.0

  describe "min/max properties", ->
    r = new FactorRange({factors: ['FOO']})

    it "should return values from synthetic range", ->

      expect(r.min).to.be.equal 0.5
      expect(r.max).to.be.equal 1.5

    it "should update when factors update", ->
      r.factors = ['FOO', 'BAR']

      expect(r.min).to.be.equal 0.5
      expect(r.max).to.be.equal 2.5

      r.factors = ['A', 'B', 'C']

      expect(r.min).to.be.equal 0.5
      expect(r.max).to.be.equal 3.5

    it "min should equal start", ->
      expect(r.min).to.be.equal r.start

    it "max should equal end", ->
      expect(r.max).to.be.equal r.end

  describe "offset property", ->
    r = new FactorRange({factors: ['FOO'], offset: -1})

    it "should be applied to other properties", ->

      expect(r.min).to.be.equal -0.5
      expect(r.max).to.be.equal 0.5

      expect(r.start).to.be.equal -0.5
      expect(r.end).to.be.equal 0.5

  describe "start/end properties", ->
    r = new FactorRange({factors: ['FOO']})

    it "should update when offset updates", ->
      r.offset = -1

      expect(r.start).to.be.equal -0.5
      expect(r.end).to.be.equal 0.5

  describe "reset method", ->

    it "should execute callback once", ->
      cb = new CustomJS()
      r = new FactorRange({callback: cb})
      spy = sinon.spy(cb, 'execute')
      r.reset()

      expect(spy.calledOnce).to.be.true

  describe "changing model attribute", ->

    it "should execute callback once", ->
      cb = new CustomJS()
      spy = sinon.spy(cb, 'execute')
      r = new FactorRange({callback: cb})

      expect(spy.called).to.be.false
      r.factors = ["A", "B", "C"]
      expect(spy.calledOnce).to.be.true
      spy.reset()
      r.offset = 10
      expect(spy.calledOnce).to.be.true
      spy.reset()
      r.bounds = [1,2]
      expect(spy.calledOnce).to.be.true
