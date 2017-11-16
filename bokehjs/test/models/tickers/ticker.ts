import {expect} from "chai"

import {Ticker} from "models/tickers/ticker"

describe("Ticker Model", () => {

  class MyTicker extends Ticker {
    get_interval() {
      return 100
    }
  }

  it("should have five major and ten minor ticks", () => {
    const ticker = new MyTicker({num_minor_ticks: 2, desired_num_ticks: 5})

    // `range` and `cross_loc` aren't used by the AdaptiveTicker, so are passed as null args
    const ticks = ticker.get_ticks(-200, 200, null, null, {})
    expect(ticks.major).to.be.deep.equal([-200, -100, 0, 100, 200])
    expect(ticks.minor).to.be.deep.equal([-250, -200, -150, -100, -50, 0, 50, 100, 150, 200, 250])
  })

  it("should have five major and five minor ticks", () => {
    const ticker = new MyTicker({num_minor_ticks: 1, desired_num_ticks: 5})

    // `range` and `cross_loc` aren't used by the AdaptiveTicker, so are passed as null args
    const ticks = ticker.get_ticks(-200, 200, null, null, {})
    expect(ticks.major).to.be.deep.equal([-200, -100, 0, 100, 200])
    expect(ticks.minor).to.be.deep.equal([-200, -100, 0, 100, 200])
  })

  it("should have five major and zero minor ticks", () => {
    const ticker = new MyTicker({num_minor_ticks: 0, desired_num_ticks: 5})

    // `range` and `cross_loc` aren't used by the AdaptiveTicker, so are passed as null args
    const ticks = ticker.get_ticks(-200, 200, null, null, {})
    expect(ticks.major).to.be.deep.equal([-200, -100, 0, 100, 200])
    expect(ticks.minor).to.be.deep.equal([])
  })

  it("should handle empty start/end case by returning no ticks", () => {
    const ticker = new MyTicker({num_minor_ticks: 2, desired_num_ticks: 5})

    // `range` and `cross_loc` aren't used by the AdaptiveTicker, so are passed as null args
    const ticks = ticker.get_ticks(NaN, NaN, null, null, {})
    expect(ticks.major).to.be.deep.equal([])
    expect(ticks.minor).to.be.deep.equal([])
  })
})
