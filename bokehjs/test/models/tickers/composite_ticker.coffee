{expect} = require "chai"
utils = require "../../utils"

{AdaptiveTicker} = utils.require("models/tickers/adaptive_ticker")
{CompositeTicker} = utils.require("models/tickers/composite_ticker")

describe "CompositeTicker Model", ->

  describe "CompositeTicker get_best_ticker method", ->

    beforeEach ->
      @ticker = new CompositeTicker({tickers:[
          new AdaptiveTicker({base: 10, min_interval: 0, max_interval: 5e2}),
          new AdaptiveTicker({base: 60, min_interval: 1e3, max_interval: 3e4})
          new AdaptiveTicker({base: 24, min_interval: 3.6e6, max_interval: 4.32e7})
        ]})

    it "should return the first ticker", ->
      ticker = @ticker.get_best_ticker(0, 1e2, 5) # 100ms range
      expect(ticker.base).to.be.equal(10)

    it "should return the second ticker", ->
      ticker = @ticker.get_best_ticker(1, 1e4, 5) # ten second range
      expect(ticker.base).to.be.equal(60)

    it "should return the third ticker", ->
      ticker = @ticker.get_best_ticker(1, 6e5, 5) # ten minute range

    it "should return the first ticker if start/end are NaNs", ->
      ticker = @ticker.get_best_ticker(NaN, NaN, 5)
      expect(ticker.base).to.be.equal(10)
