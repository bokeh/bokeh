import {expect} from "assertions"

import {AdaptiveTicker} from "@bokehjs/models/tickers/adaptive_ticker"
import {DatetimeTicker} from "@bokehjs/models/tickers/datetime_ticker"
import {DaysTicker} from "@bokehjs/models/tickers/days_ticker"
import {MonthsTicker} from "@bokehjs/models/tickers/months_ticker"
import {YearsTicker} from "@bokehjs/models/tickers/years_ticker"

describe("DatetimeTicker Model", () => {

  it("should configure standard subtickers", () => {
    const ticker = new DatetimeTicker()
    expect(ticker.tickers.length).to.be.equal(12)
    expect(ticker.tickers[0]).to.be.instanceof(AdaptiveTicker)
    expect(ticker.tickers[1]).to.be.instanceof(AdaptiveTicker)
    expect(ticker.tickers[2]).to.be.instanceof(AdaptiveTicker)

    expect(ticker.tickers[3]).to.be.instanceof(DaysTicker)
    expect(ticker.tickers[4]).to.be.instanceof(DaysTicker)
    expect(ticker.tickers[5]).to.be.instanceof(DaysTicker)
    expect(ticker.tickers[6]).to.be.instanceof(DaysTicker)

    expect(ticker.tickers[7]).to.be.instanceof(MonthsTicker)
    expect(ticker.tickers[8]).to.be.instanceof(MonthsTicker)
    expect(ticker.tickers[9]).to.be.instanceof(MonthsTicker)
    expect(ticker.tickers[10]).to.be.instanceof(MonthsTicker)

    expect(ticker.tickers[11]).to.be.instanceof(YearsTicker)
  })

})
