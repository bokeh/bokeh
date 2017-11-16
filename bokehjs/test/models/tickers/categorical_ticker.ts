{expect} = require "chai"
utils = require "../../utils"

{CategoricalTicker} = utils.require("models/tickers/categorical_ticker")
{FactorRange} = utils.require("models/ranges/factor_range")

describe "CategoricalTicker Model", ->

  describe "CategoricalTicker get_ticks method", ->

    beforeEach ->
      @ticker = new CategoricalTicker()

    it "should handle case where range has no factors", ->
      range = new FactorRange()
      ticks = @ticker.get_ticks(0, 10, range, null, {}) #cross_loc is null
      expect(ticks.major).to.be.deep.equal([ ])
      expect(ticks.minor).to.be.deep.equal([ ])

    it "should handle case where range has factors", ->
      range = new FactorRange({factors:["foo", "bar", "bat"]})
      ticks = @ticker.get_ticks(0, 3, range, null, {}) #cross_loc is null
      expect(ticks.major).to.be.deep.equal([ "foo", "bar", "bat" ])
      expect(ticks.minor).to.be.deep.equal([ ])

    it "should handle partial range correctly", ->
      range = new FactorRange({factors:["foo", "bar", "bat"]})
      # should just show middle factor (index=2)
      ticks = @ticker.get_ticks(1, 2, range, null, {}) #cross_loc is null
      expect(ticks.major).to.be.deep.equal([ "bar" ])
      expect(ticks.minor).to.be.deep.equal([ ])
