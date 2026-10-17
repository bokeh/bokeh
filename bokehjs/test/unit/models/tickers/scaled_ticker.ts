import {expect} from "#framework/assertions"

import {BasicTicker} from "@bokehjs/models/tickers/basic_ticker"
import {FixedTicker} from "@bokehjs/models/tickers/fixed_ticker"
import {ScaledTicker} from "@bokehjs/models/tickers/scaled_ticker"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {with_log_level} from "@bokehjs/core/logging"

describe("ScaledTicker", () => {
  const range = Range1d.create({start: 0, end: 8*Math.PI})

  it("should use a BasicTicker and unit scale by default", () => {
    const ticker = ScaledTicker.create()
    expect(ticker.scale).to.be.equal(1)
    expect(ticker.offset).to.be.equal(0)
    expect(ticker.ticker).to.be.instanceof(BasicTicker)
  })

  it("should require a positive scale", () => {
    with_log_level("off", () => {
      expect(() => ScaledTicker.create({scale: 0})).to.throw()
      expect(() => ScaledTicker.create({scale: -1})).to.throw()
    })
  })

  it("should compute intervals in normalized coordinates", () => {
    const ticker = ScaledTicker.create({scale: Math.PI, desired_num_ticks: 4})
    expect(ticker.get_interval(0, 8*Math.PI, 4)).to.be.equal(2*Math.PI)
  })

  it("should scale major and minor ticks", () => {
    const ticker = ScaledTicker.create({
      scale: Math.PI,
      desired_num_ticks: 4,
      num_minor_ticks: 2,
    })
    const ticks = ticker.get_ticks(0, 8*Math.PI, range, NaN)

    expect(ticks.major).to.be.equal([0, 2*Math.PI, 4*Math.PI, 6*Math.PI, 8*Math.PI])
    expect(ticks.minor).to.be.equal([
      0, Math.PI, 2*Math.PI, 3*Math.PI, 4*Math.PI,
      5*Math.PI, 6*Math.PI, 7*Math.PI, 8*Math.PI,
    ])
  })

  it("should scale ticks supplied by the wrapped ticker", () => {
    const ticker = ScaledTicker.create({
      scale: Math.PI,
      ticker: FixedTicker.create({ticks: [-1, 0, 1], minor_ticks: [-0.5, 0.5]}),
    })
    const ticks = ticker.get_ticks(-Math.PI, Math.PI, range, NaN)

    expect(ticks.major).to.be.equal([-Math.PI, 0, Math.PI])
    expect(ticks.minor).to.be.equal([-Math.PI/2, Math.PI/2])
  })

  it("should offset ticks supplied by the wrapped ticker", () => {
    const ticker = ScaledTicker.create({
      scale: Math.PI,
      offset: 10,
      ticker: FixedTicker.create({ticks: [-1, 0, 1], minor_ticks: [-0.5, 0.5]}),
    })
    const ticks = ticker.get_ticks(10 - Math.PI, 10 + Math.PI, range, NaN)

    expect(ticks.major).to.be.equal([10 - Math.PI, 10, 10 + Math.PI])
    expect(ticks.minor).to.be.equal([10 - Math.PI/2, 10 + Math.PI/2])
  })

  it("should offset interval bounds before delegating", () => {
    const ticker = ScaledTicker.create({scale: Math.PI, offset: 10, desired_num_ticks: 4})
    expect(ticker.get_interval(10, 10 + 8*Math.PI, 4)).to.be.equal(2*Math.PI)
  })

  it("should scale the wrapped ticker's interval bounds", () => {
    const inner = BasicTicker.create({min_interval: 0.5, max_interval: 5})
    const ticker = ScaledTicker.create({scale: Math.PI, ticker: inner})

    expect(ticker.get_min_interval()).to.be.equal(Math.PI/2)
    expect(ticker.get_max_interval()).to.be.equal(5*Math.PI)
  })

  it("should propagate changes from the wrapped ticker", () => {
    const inner = BasicTicker.create()
    const ticker = ScaledTicker.create({ticker: inner})
    let changes = 0
    ticker.change.connect(() => changes++)

    inner.base = 20
    expect(changes).to.be.equal(1)

    const replacement = BasicTicker.create()
    ticker.ticker = replacement
    const after_replacement = changes
    inner.base = 30
    expect(changes).to.be.equal(after_replacement)
    replacement.base = 30
    expect(changes).to.be.equal(after_replacement + 1)
  })
})
