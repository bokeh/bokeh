{expect} = require "chai"
utils = require "../../utils"

{AdaptiveTicker} = utils.require("models/tickers/adaptive_ticker")

describe "AdaptiveTicker Model", ->

  describe "AdaptiveTicker initialize method", ->

    it "should set extended_mantissas property", ->
      ticker = new AdaptiveTicker({mantissas: [1, 2, 5]})
      expect(ticker.extended_mantissas).to.be.deep.equal([ 0.5, 1, 2, 5, 10 ])

    it "should set base_factor property as one by default", ->
      ticker = new AdaptiveTicker()
      expect(ticker.base_factor).to.be.equal(1)

    it "should set base_factor property as min_interval if set", ->
      ticker = new AdaptiveTicker({min_interval: 10})
      expect(ticker.base_factor).to.be.equal(10)

  describe "AdaptiveTicker get_interval method", ->

    beforeEach ->
      @ticker = new AdaptiveTicker({mantissas: [1,2,5], base: 10})

    it "should use the '1' mantissa", ->
      interval = @ticker.get_interval(0, 1000, 10)
      expect(interval).to.be.equal(100)

    it "should use the '2' matissa", ->
      interval = @ticker.get_interval(0, 1000, 5)
      expect(interval).to.be.equal(200)

    it "should use the '5' matissa", ->
      interval = @ticker.get_interval(0, 1000, 2)
      expect(interval).to.be.equal(500)

    it "should use the min_interval", ->
      @ticker.min_interval = 250
      interval = @ticker.get_interval(0, 1000, 10)
      expect(interval).to.be.equal(250)

    it "should use the max_interval", ->
      @ticker.max_interval = 50
      interval = @ticker.get_interval(0, 1000, 10)
      expect(interval).to.be.equal(50)
