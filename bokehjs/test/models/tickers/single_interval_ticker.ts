{expect} = require "chai"
utils = require "../../utils"

{SingleIntervalTicker} = utils.require("models/tickers/single_interval_ticker")

describe "SingleIntervalTicker Model", ->

  describe "SingleIntervalTicker get_interval method", ->

    it "should return interval property if set", ->
      ticker = new SingleIntervalTicker({interval: 10})
      interval = ticker.get_interval()
      expect(interval).to.be.equal(10)

    it "should return undefined if interval property is not set", ->
      ticker = new SingleIntervalTicker()
      interval = ticker.get_interval()
      expect(interval).to.be.equal(null)
