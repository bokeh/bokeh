import {expect} from "chai"

import {AdaptiveTicker} from "models/tickers/adaptive_ticker"
import {CompositeTicker} from "models/tickers/composite_ticker"

describe("CompositeTicker Model", () => {

  describe("CompositeTicker get_best_ticker method", () => {

    const composite_ticker = () => {
      return new CompositeTicker({tickers: [
        new AdaptiveTicker({base: 10, min_interval: 0, max_interval: 5e2}),
        new AdaptiveTicker({base: 60, min_interval: 1e3, max_interval: 3e4}),
        new AdaptiveTicker({base: 24, min_interval: 3.6e6, max_interval: 4.32e7}),
      ]})
    }

    it("should return the first ticker", () => {
      const ticker = composite_ticker()
      const best_ticker = ticker.get_best_ticker(0, 1e2, 5) // 100ms range
      expect(best_ticker).to.be.instanceOf(AdaptiveTicker)
      expect((best_ticker as AdaptiveTicker).base).to.be.equal(10)
    })

    it("should return the second ticker", () => {
      const ticker = composite_ticker()
      const best_ticker = ticker.get_best_ticker(1, 1e4, 5) // ten second range
      expect(best_ticker).to.be.instanceOf(AdaptiveTicker)
      expect((best_ticker as AdaptiveTicker).base).to.be.equal(60)
    })

    it("should return the third ticker", () => {
      const ticker = composite_ticker()
      const best_ticker = ticker.get_best_ticker(1, 6e5, 5) // ten minute range
      expect(best_ticker).to.be.instanceOf(AdaptiveTicker)
      expect((best_ticker as AdaptiveTicker).base).to.be.equal(24)
    })

    it("should return the first ticker if start/end are NaNs", () => {
      const ticker = composite_ticker()
      const best_ticker = ticker.get_best_ticker(NaN, NaN, 5)
      expect(best_ticker).to.be.instanceOf(AdaptiveTicker)
      expect((best_ticker as AdaptiveTicker).base).to.be.equal(10)
    })
  })
})
