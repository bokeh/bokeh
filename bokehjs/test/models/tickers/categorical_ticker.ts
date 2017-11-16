import {expect} from "chai"

import {CategoricalTicker} from "models/tickers/categorical_ticker"
import {FactorRange} from "models/ranges/factor_range"

describe("CategoricalTicker Model", () => {

  describe("CategoricalTicker get_ticks method", () => {

    it("should handle case where range has no factors", () => {
      const ticker = new CategoricalTicker()
      const range = new FactorRange()
      const ticks = ticker.get_ticks(0, 10, range, null, {}) // cross_loc is null
      expect(ticks.major).to.be.deep.equal([])
      expect(ticks.minor).to.be.deep.equal([])
    })

    it("should handle case where range has factors", () => {
      const ticker = new CategoricalTicker()
      const range = new FactorRange({factors: ["foo", "bar", "bat"]})
      const ticks = ticker.get_ticks(0, 3, range, null, {}) // cross_loc is null
      expect(ticks.major).to.be.deep.equal(["foo", "bar", "bat"])
      expect(ticks.minor).to.be.deep.equal([])
    })

    it("should handle partial range correctly", () => {
      const ticker = new CategoricalTicker()
      const range = new FactorRange({factors: ["foo", "bar", "bat"]})
      //  should just show middle factor (index=2)
      const ticks = ticker.get_ticks(1, 2, range, null, {}) // cross_loc is null
      expect(ticks.major).to.be.deep.equal(["bar"])
      expect(ticks.minor).to.be.deep.equal([])
    })
  })
})
