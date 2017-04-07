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

  describe "AdaptiveTicker get_ticks method", ->

    it "should have five major and ten minor ticks", ->
      ticker = new AdaptiveTicker({mantissas: [5], base: 10, desired_num_ticks: 5, num_minor_ticks: 2})

      # `range` and `cross_loc` aren't used by the AdaptiveTicker, so are passed as null args
      ticks = ticker.get_ticks(-100, 100, null, null, {})
      expect(ticks.major).to.be.deep.equal([ -100, -50, 0, 50, 100 ])
      expect(ticks.minor).to.be.deep.equal([ -125, -100, -75, -50, -25, 0, 25, 50, 75, 100, 125 ])

    it "should have five major and five minor ticks", ->
      ticker = new AdaptiveTicker({mantissas: [512], base: 1024, desired_num_ticks: 5, num_minor_ticks:1})

      ticks = ticker.get_ticks(-1024, 1024, null, null, {})
      expect(ticks.major).to.be.deep.equal([ -1024, -512, 0, 512, 1024 ])
      expect(ticks.minor).to.be.deep.equal([ -1024, -512, 0, 512, 1024 ])

    it "should have five major and zero minor ticks", ->
      ticker = new AdaptiveTicker({mantissas: [512], base: 1024, desired_num_ticks: 5, num_minor_ticks:0})

      ticks = ticker.get_ticks(-1024, 1024, null, null, {})
      expect(ticks.major).to.be.deep.equal([ -1024, -512, 0, 512, 1024 ])
      expect(ticks.minor).to.be.deep.equal([ ])
