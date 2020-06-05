import {expect} from "assertions"

import {LogTicker} from "@bokehjs/models/tickers/log_ticker"

describe("LogTicker Model", () => {

  describe("LogTicker get_ticks_no_defaults method", () => {

    // not finite range

    it("should return empty ticks when start/end is not finite", () => {
      const ticker = new LogTicker()
      const ticks = ticker.get_ticks_no_defaults(NaN, NaN, null, 3)
      expect(ticks.major).to.be.equal([])
      expect(ticks.minor).to.be.equal([])
    })

    it("should return empty ticks when log(start) or log(end) not finite", () => {
      const ticker = new LogTicker()
      const ticks = ticker.get_ticks_no_defaults(0, 100, null, 3)
      expect(ticks.major).to.be.equal([])
      expect(ticks.minor).to.be.equal([])
    })

    // short range (<2 base orders)

    it("should have three major ticks and zero minor ticks for short range", () => {
      const ticker = new LogTicker({desired_num_ticks: 3, num_minor_ticks: 0})
      const ticks = ticker.get_ticks_no_defaults(1, 999, null, 3)
      expect(ticks.major).to.be.equal([1, 10, 100])
      expect(ticks.minor).to.be.equal([])
    })

    it("should have three major ticks and three minor ticks for short range", () => {
      const ticker = new LogTicker({desired_num_ticks: 3, num_minor_ticks: 1})
      const ticks = ticker.get_ticks_no_defaults(1, 999, null, 3)
      expect(ticks.major).to.be.equal([1, 10, 100])
      expect(ticks.minor).to.be.equal([1, 10, 100])
    })

    it("should have three major ticks and six minor ticks for short range", () => {
      const ticker = new LogTicker({desired_num_ticks: 3, num_minor_ticks: 2})
      const ticks = ticker.get_ticks_no_defaults(1, 999, null, 3)
      expect(ticks.major).to.be.equal([1, 10, 100])
      expect(ticks.minor).to.be.equal([1, 5, 10, 50, 100, 500])
    })

    // long range (>=2 base orders)

    it("should have four major ticks and zero minor ticks for long range", () => {
      const ticker = new LogTicker({num_minor_ticks: 0})
      const ticks = ticker.get_ticks_no_defaults(1, 1000, null, 4)
      expect(ticks.major).to.be.equal([1e0, 1e1, 1e2, 1e3])
      expect(ticks.minor).to.be.equal([])
    })

    it("should have four major ticks and four minor ticks for long range", () => {
      const ticker = new LogTicker({num_minor_ticks: 1})
      const ticks = ticker.get_ticks_no_defaults(1, 1000, null, 4)
      expect(ticks.major).to.be.equal([1e0, 1e1, 1e2, 1e3])
      expect(ticks.minor).to.be.equal([1e0, 1e1, 1e2, 1e3])
    })

    it("should have four major ticks and seven minor ticks for long range", () => {
      const ticker = new LogTicker({num_minor_ticks: 2})
      const ticks = ticker.get_ticks_no_defaults(1, 1000, null, 4)
      expect(ticks.major).to.be.equal([1e0, 1e1, 1e2, 1e3])
      expect(ticks.minor).to.be.equal([1e0, 5e0, 1e1, 5e1, 1e2, 5e2, 1e3])
    })

    it("should have correct default ticks for (1.0001, 1e3) range", () => {
      const ticker = new LogTicker()
      const ticks = ticker.get_ticks_no_defaults(1.0001, 1e3, null, 4)
      expect(ticks.major).to.be.equal([1e1, 1e2, 1e3])
      expect(ticks.minor).to.be.equal([2, 4, 6, 8, 10, 20, 40, 60, 80, 100, 200, 400, 600, 800, 1000])
    })
  })
})
