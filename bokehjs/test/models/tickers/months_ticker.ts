import {expect} from "chai"

import {MonthsTicker} from "models/tickers/months_ticker"
import {ONE_MONTH} from "models/tickers/util"

describe("MonthsTicker Model", () => {

  it("should configure an interval of 12*ONE_MONTH with a single month", () => {
    const ticker = new MonthsTicker({months: [6]})
    expect(ticker.interval).to.be.equal(12*ONE_MONTH)
  })

  it("should configure an interval of (diff)*ONE_MONTH with a multiple months", () => {
    const ticker = new MonthsTicker({months: [0,3,6,9]})
    expect(ticker.interval).to.be.equal(3*ONE_MONTH)
  })

  it("should return nice ticks on a single interval", () => {
    const ticker = new MonthsTicker({months: [6]})
    const ticks = ticker.get_ticks_no_defaults(Date.UTC(2000, 0, 1), Date.UTC(2005, 0, 1), null, 5)
    const expected_major = [2000, 2001, 2002, 2003, 2004].map((year) => Date.UTC(year, 6, 1))
    expect(ticks.major).to.deep.equal(expected_major)
    expect(ticks.minor).to.deep.equal([])
  })

  it("should return nice ticks on multiple intervals", () => {
    const ticker = new MonthsTicker({months: [3, 9]})
    const ticks = ticker.get_ticks_no_defaults(Date.UTC(2000, 0, 1), Date.UTC(2002, 0, 1), null, 5)
    const expected_major = [Date.UTC(2000, 3, 1), Date.UTC(2000, 9, 1), Date.UTC(2001, 3, 1), Date.UTC(2001, 9, 1)]
    expect(ticks.major).to.deep.equal(expected_major)
    expect(ticks.minor).to.deep.equal([])
  })

})
