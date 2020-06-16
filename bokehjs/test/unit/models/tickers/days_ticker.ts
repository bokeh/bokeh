import {expect} from "assertions"

import {DaysTicker} from "@bokehjs/models/tickers/days_ticker"
import {ONE_DAY} from "@bokehjs/models/tickers/util"

describe("DaysTicker Model", () => {

  it("should configure an interval of 31*ONE_DAY with a single day", () => {
    const ticker = new DaysTicker({days: [6]})
    expect(ticker.interval).to.be.equal(31*ONE_DAY)
  })

  it("should configure an interval of (diff)*ONE_DAY with a multiple days", () => {
    const ticker = new DaysTicker({days: [0, 3, 6, 9]})
    expect(ticker.interval).to.be.equal(3*ONE_DAY)
  })

  it("should return nice ticks on a single interval", () => {
    const ticker = new DaysTicker({days: [6]})
    const ticks = ticker.get_ticks_no_defaults(Date.UTC(2000, 0, 1), Date.UTC(2000, 3, 31), null, 5)
    const expected_major = [0, 1, 2, 3].map((month) => Date.UTC(2000, month, 6))
    expect(ticks.major).to.be.equal(expected_major)
    expect(ticks.minor).to.be.equal([])
  })

  it("should skip end ticks if interval is too small", () => {
    const ticker = new DaysTicker({days: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31]})
    expect(ticker.interval).to.be.equal(3*ONE_DAY)
    const ticks = ticker.get_ticks_no_defaults(Date.UTC(2001, 2, 15), Date.UTC(2001, 3, 9), null, 5)
    const expected_major = [
      Date.UTC(2001, 2, 16), Date.UTC(2001, 2, 19), Date.UTC(2001, 2, 22), Date.UTC(2001, 2, 25),
      Date.UTC(2001, 2, 28),  // this should not be here but JS date is boken
      Date.UTC(2001, 3, 1),  Date.UTC(2001, 3, 4),  Date.UTC(2001, 3, 7)]
    expect(ticks.major).to.be.equal(expected_major)
    expect(ticks.minor).to.be.equal([])
  })

})
