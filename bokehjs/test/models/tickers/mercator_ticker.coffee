{expect} = require "chai"
utils = require "../../utils"

{MercatorTicker} = utils.require("models/tickers/mercator_ticker")

describe "MercatorTicker Model", ->

  describe "get_ticks_no_defaults method", ->

    it "should clip longitude ticks outside projection bounds", ->
      ticker = new MercatorTicker({dimension: 'lon'})
      ticks = ticker.get_ticks_no_defaults(-20036376, 10018754, -20048966.10, 3)
      expect(ticks.major).to.deep.equal [-11131949.079327356, 0]

