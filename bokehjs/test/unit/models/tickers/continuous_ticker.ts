import {expect} from "assertions"

import {ContinuousTicker} from "@bokehjs/models/tickers/continuous_ticker"

describe("ContinuousTicker Model", () => {

  class MyTicker extends ContinuousTicker {
    get_interval(_data_low: number, _data_high: number, _desired_n_ticks: number): number {
      return 100
    }
  }

  it("should have five major and minor ticks only inside bounds", () => {
    const ticker = new MyTicker({num_minor_ticks: 2, desired_num_ticks: 5})

    // `range` and `cross_loc` aren't used by the AdaptiveTicker, so are passed as null args
    const ticks = ticker.get_ticks(-200, 200, null, null, {})
    expect(ticks.major).to.be.equal([-200, -100, 0, 100, 200])
    expect(ticks.minor).to.be.equal([-200, -150, -100, -50, 0, 50, 100, 150, 200])
  })

  it("should have five major and matching minor ticks", () => {
    const ticker = new MyTicker({num_minor_ticks: 1, desired_num_ticks: 5})

    // `range` and `cross_loc` aren't used by the AdaptiveTicker, so are passed as null args
    const ticks = ticker.get_ticks(-200, 200, null, null, {})
    expect(ticks.major).to.be.equal([-200, -100, 0, 100, 200])
    expect(ticks.minor).to.be.equal([-200, -100, 0, 100, 200])
  })

  it("should have five major and zero minor ticks", () => {
    const ticker = new MyTicker({num_minor_ticks: 0, desired_num_ticks: 5})

    // `range` and `cross_loc` aren't used by the AdaptiveTicker, so are passed as null args
    const ticks = ticker.get_ticks(-200, 200, null, null, {})
    expect(ticks.major).to.be.equal([-200, -100, 0, 100, 200])
    expect(ticks.minor).to.be.equal([])
  })

  it("should handle empty start/end case by returning no ticks", () => {
    const ticker = new MyTicker({num_minor_ticks: 2, desired_num_ticks: 5})

    // `range` and `cross_loc` aren't used by the AdaptiveTicker, so are passed as null args
    const ticks = ticker.get_ticks(NaN, NaN, null, null, {})
    expect(ticks.major).to.be.equal([])
    expect(ticks.minor).to.be.equal([])
  })

  describe("ContinuousTicker get_min_interval method", () => {

    it("should return min_interval property", () => {
      const ticker = new MyTicker()
      ticker.min_interval = 1
      expect(ticker.get_min_interval()).to.be.equal(1)
    })
  })

  describe("ContinuousTicker get_max_interval method", () => {

    it("should return max_interval property if set", () => {
      const ticker = new MyTicker()
      ticker.max_interval = 2
      expect(ticker.get_max_interval()).to.be.equal(2)
    })

    it("should return Infinity if unset", () => {
      const ticker = new MyTicker()
      expect(ticker.get_max_interval()).to.be.equal(Infinity)
    })
  })

  describe("ContinuousTicker get_interval method", () => {

    it("should return correct tick interval", () => {
      const ticker = new MyTicker()
      const interval = ticker.get_ideal_interval(0, 100, 10)
      expect(interval).to.be.equal(10)
    })

    it("should return NaN if start/end is NaN", () => {
      const ticker = new MyTicker()
      const interval = ticker.get_ideal_interval(0, NaN, 10)
      expect(interval).to.be.NaN
    })

    it("should return NaN if desired_n_ticks is NaN", () => {
      const ticker = new MyTicker()
      const interval = ticker.get_ideal_interval(0, 100, NaN)
      expect(interval).to.be.NaN
    })
  })
})
