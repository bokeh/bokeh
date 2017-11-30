import {expect} from "chai"

import {FixedTicker} from "models/tickers/fixed_ticker"

describe("FixedTicker Model", () => {

  describe("FixedTicker get_ticks_no_defaults method", () => {

    it("should return ticks property as major ticks if set", () => {
      const t = [0, 5, 10]
      const ticker = new FixedTicker({ticks: t})
      const ticks = ticker.get_ticks_no_defaults(NaN, NaN, null, NaN)
      expect(ticks.major).to.be.deep.equal(t)
      expect(ticks.minor).to.be.deep.equal([])
    })

    it("should return empty array as major ticks if ticks property is unset", () => {
      const ticker = new FixedTicker()
      const ticks = ticker.get_ticks_no_defaults(NaN, NaN, null, NaN)
      expect(ticks.major).to.be.deep.equal([])
      expect(ticks.minor).to.be.deep.equal([])
    })
  })
})
