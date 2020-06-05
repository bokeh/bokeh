import {expect} from "assertions"

import {YearsTicker} from "@bokehjs/models/tickers/years_ticker"
import {ONE_YEAR} from "@bokehjs/models/tickers/util"

describe("YearsTicker Model", () => {

  it("should configure an interval of ONE_YEAR", () => {
    const ticker = new YearsTicker()
    expect(ticker.interval).to.be.equal(ONE_YEAR)
  })

  it("should return nice ticks on year intervals", () => {
    const ticker = new YearsTicker()
    const ticks = ticker.get_ticks_no_defaults(Date.UTC(2000, 0, 1), Date.UTC(2005, 0, 1), null, 5)
    const expected_major = [2000, 2001, 2002, 2003, 2004, 2005].map((year) => Date.UTC(year, 0, 1))
    expect(ticks.major).to.be.equal(expected_major)
    expect(ticks.minor).to.be.equal([])
  })

  it("should return nice ticks on multi year intervals", () => {
    const ticker = new YearsTicker()
    const ticks = ticker.get_ticks_no_defaults(Date.UTC(1900, 0, 1), Date.UTC(2000, 0, 1), null, 5)
    const expected_major = [1900, 1920, 1940, 1960, 1980, 2000].map((year) => Date.UTC(year, 0, 1))
    expect(ticks.major).to.be.equal(expected_major)
    expect(ticks.minor).to.be.equal([])
  })

})
