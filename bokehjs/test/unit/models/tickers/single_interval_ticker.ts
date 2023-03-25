import {expect} from "assertions"

import {SingleIntervalTicker} from "@bokehjs/models/tickers/single_interval_ticker"

describe("SingleIntervalTicker Model", () => {

  describe("SingleIntervalTicker get_interval method", () => {

    it("should return interval property if set", () => {
      const ticker = new SingleIntervalTicker({interval: 10})
      const interval = ticker.get_interval(0, 10, 11)
      expect(interval).to.be.equal(10)
    })

    it("should throw if interval property is not set", () => {
      const ticker = new SingleIntervalTicker()
      expect(() => ticker.get_interval(0, 10, 11)).to.throw()
    })
  })
})
