import {expect} from "assertions"

import {LogTickFormatter} from "@bokehjs/models/formatters/log_tick_formatter"
import {LogTicker} from "@bokehjs/models/tickers/log_ticker"

describe("LogTickFormatter", () => {
  describe("doFormat method", () => {
    it("should format numerical ticks appropriately with min_exponent equals 0 by default", () => {
      const formatter = new LogTickFormatter()
      const labels = formatter.doFormat([0.001, 0.1, 1, 10, 100], {loc: 0})
      expect(labels).to.be.equal(["10^−3", "10^−1", "10^0", "10^1", "10^2"])
    })

    it("should format numerical ticks appropriately with min_exponent equals 1", () => {
      const formatter = new LogTickFormatter({min_exponent: 1})
      const labels = formatter.doFormat([0.001, 0.1, 1, 10, 100], {loc: 0})
      expect(labels).to.be.equal(["10^−3", "10^−1", "1", "10^1", "10^2"])
    })

    it("should format numerical ticks appropriately with min_exponent equals 2", () => {
      const formatter = new LogTickFormatter({min_exponent: 2})
      const labels = formatter.doFormat([0.001, 0.1, 1, 10, 100], {loc: 0})
      expect(labels).to.be.equal(["10^−3", "0.1", "1", "10", "10^2"])
    })

    it("should format numerical ticks appropriately with min_exponent equals 3 and base 2", () => {
      const ticker = new LogTicker({base: 2})
      const formatter = new LogTickFormatter({ticker, min_exponent: 3})
      const labels = formatter.doFormat([1, 4, 16, 64, 256], {loc: 0})
      expect(labels).to.be.equal(["1", "4", "2^4", "2^6", "2^8"])
    })
  })
})
