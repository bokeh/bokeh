import {expect} from "chai"

import {SingleIntervalTicker} from "models/tickers/single_interval_ticker"

describe("SingleIntervalTicker Model", () => {

  describe("SingleIntervalTicker get_interval method", () => {

    it("should return interval property if set", () => {
      const ticker = new SingleIntervalTicker({interval: 10})
      const interval = ticker.get_interval(0, 10, 11)
      expect(interval).to.be.equal(10)
    })

    it("should return null if interval property is not set", () => {
      const ticker = new SingleIntervalTicker()
      const interval = ticker.get_interval(0, 10, 11)
      expect(interval).to.be.equal(null)
    })
  })
})
