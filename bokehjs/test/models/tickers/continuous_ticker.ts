import {expect} from "chai"

import {ContinuousTicker} from "models/tickers/continuous_ticker"

describe("ContinuousTicker Model", () => {

  describe("ContinuousTicker get_min_interval method", () => {

    it("should return min_interval property", () => {
      const ticker = new ContinuousTicker({min_interval: 1})
      expect(ticker.get_min_interval()).to.be.equal(1)
    })
  })

  describe("ContinuousTicker get_max_interval method", () => {

    it("should return max_interval property if set", () => {
      const ticker = new ContinuousTicker({max_interval: 2})
      expect(ticker.get_max_interval()).to.be.equal(2)
    })

    it("should return Infinity if unset", () => {
      const ticker = new ContinuousTicker()
      expect(ticker.get_max_interval()).to.be.equal(Infinity)
    })
  })

  describe("ContinuousTicker get_interval method", () => {

    it("should return correct tick interval", () => {
      const ticker = new ContinuousTicker()
      const interval = ticker.get_ideal_interval(0, 100, 10)
      expect(interval).to.be.equal(10)
    })

    it("should return NaN if start/end is NaN", () => {
      const ticker = new ContinuousTicker()
      const interval = ticker.get_ideal_interval(0, NaN, 10)
      expect(interval).to.be.NaN
    })

    it("should return NaN if desired_n_ticks is NaN", () => {
      const ticker = new ContinuousTicker()
      const interval = ticker.get_ideal_interval(0, 100, NaN)
      expect(interval).to.be.NaN
    })
  })
})
