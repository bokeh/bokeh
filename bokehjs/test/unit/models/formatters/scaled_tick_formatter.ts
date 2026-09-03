import {expect} from "#framework/assertions"

import {BasicTickFormatter} from "@bokehjs/models/formatters/basic_tick_formatter"
import {LogTickFormatter} from "@bokehjs/models/formatters/log_tick_formatter"
import {PrintfTickFormatter} from "@bokehjs/models/formatters/printf_tick_formatter"
import {ScaledTickFormatter} from "@bokehjs/models/formatters/scaled_tick_formatter"
import {BasicTicker} from "@bokehjs/models/tickers/basic_ticker"
import {ScaledTicker} from "@bokehjs/models/tickers/scaled_ticker"
import {BaseExpo, InlineBox, TextBox} from "@bokehjs/core/graphics"

describe("ScaledTickFormatter", () => {
  it("should use a BasicTickFormatter and unit style by default", () => {
    const formatter = ScaledTickFormatter.create()
    expect(formatter.ticker).to.be.null
    expect(formatter.formatter).to.be.instanceof(BasicTickFormatter)
    expect(formatter.base_label).to.be.equal("")
    expect(formatter.unit_style).to.be.equal("always")
    expect(formatter.use_fractions).to.be.false
    expect(formatter.fraction_style).to.be.equal("stacked")
    expect(formatter.max_denominator).to.be.equal(16)
    expect(formatter.doFormat([0, 1, 2], {loc: 0})).to.be.equal(["0", "1", "2"])
  })

  it("should format symbolic multiples using the axis ticker's scale", () => {
    const ticker = ScaledTicker.create({scale: Math.PI})
    const formatter = ScaledTickFormatter.create({
      suffix: "π",
      unit_style: "symbolic",
    })
    const labels = formatter.doFormat(
      [-Math.PI, 0, Math.PI, 2*Math.PI, 8*Math.PI],
      {loc: 0, ticker},
    )

    expect(labels).to.be.equal(["−π", "0", "π", "2π", "8π"])
  })

  it("should format signed offsets from a base label", () => {
    const ticker = ScaledTicker.create({scale: 1})
    const formatter = ScaledTickFormatter.create({
      ticker,
      base_label: "x̄",
      suffix: "σ",
      unit_style: "symbolic",
    })

    expect(formatter.doFormat([-3, -1, 0, 1, 3], {loc: 0})).to.be.equal([
      "x̄−3σ", "x̄−σ", "x̄", "x̄+σ", "x̄+3σ",
    ])
  })

  it("should prefer a scaled axis ticker over the fallback ticker", () => {
    const ticker = ScaledTicker.create({scale: Math.PI})
    const fallback = ScaledTicker.create({scale: 2})
    const formatter = ScaledTickFormatter.create({ticker: fallback, suffix: "π"})

    expect(formatter.doFormat([Math.PI], {loc: 0, ticker})).to.be.equal(["1π"])
  })

  it("should use the fallback ticker when the axis ticker isn't scaled", () => {
    const ticker = BasicTicker.create()
    const fallback = ScaledTicker.create({scale: Math.PI})
    const formatter = ScaledTickFormatter.create({ticker: fallback, suffix: "π"})

    expect(formatter.doFormat([Math.PI], {loc: 0, ticker})).to.be.equal(["1π"])
  })

  it("should delegate normalized values to another formatter", () => {
    const ticker = ScaledTicker.create({scale: Math.PI})
    const formatter = ScaledTickFormatter.create({
      ticker,
      formatter: PrintfTickFormatter.create({format: "%.1f"}),
      prefix: "<",
      suffix: "π",
    })

    expect(formatter.doFormat([Math.PI/2], {loc: 0})).to.be.equal(["<0.5π"])
  })

  it("should tolerate floating point noise when omitting one", () => {
    const ticker = ScaledTicker.create({scale: Math.PI})
    const formatter = ScaledTickFormatter.create({ticker, suffix: "π", unit_style: "symbolic"})

    expect(formatter.doFormat([(1 + Number.EPSILON)*Math.PI], {loc: 0})).to.be.equal(["π"])
  })

  it("should apply omission to the values displayed by the inner formatter", () => {
    const ticker = ScaledTicker.create({scale: Math.PI})
    const formatter = ScaledTickFormatter.create({
      ticker,
      formatter: PrintfTickFormatter.create({format: "%.0f"}),
      suffix: "π",
      unit_style: "symbolic",
    })

    expect(formatter.doFormat([1e-17*Math.PI, 0.9*Math.PI], {loc: 0})).to.be.equal(["0", "π"])
  })

  it("should use the inner formatter's minus sign", () => {
    const ticker = ScaledTicker.create({scale: Math.PI})
    const formatter = ScaledTickFormatter.create({
      ticker,
      formatter: PrintfTickFormatter.create({format: "%.0f"}),
      suffix: "π",
      unit_style: "symbolic",
    })

    expect(formatter.doFormat([-Math.PI, -2*Math.PI], {loc: 0})).to.be.equal(["-π", "-2π"])
  })

  it("should display small rational coefficients as fractions", () => {
    const ticker = ScaledTicker.create({scale: Math.PI})
    const formatter = ScaledTickFormatter.create({
      ticker,
      formatter: PrintfTickFormatter.create({format: "%.3f"}),
      suffix: "π",
      unit_style: "symbolic",
      use_fractions: true,
      max_denominator: 4,
    })

    const labels = formatter.doFormat(
      [Math.PI/4, Math.PI/2, 3*Math.PI/4, -Math.PI/4],
      {loc: 0},
    )
    expect(labels).to.be.equal(["π/4", "π/2", "3π/4", "-π/4"])
  })

  it("should use fractions only when every tick can be represented", () => {
    const ticker = ScaledTicker.create({scale: Math.PI})
    const formatter = ScaledTickFormatter.create({
      ticker,
      formatter: PrintfTickFormatter.create({format: "%.3f"}),
      suffix: "π",
      unit_style: "symbolic",
      use_fractions: true,
      max_denominator: 8,
    })

    const labels = formatter.doFormat([3*Math.PI/8, 9*Math.PI/16], {loc: 0})
    expect(labels).to.be.equal(["0.375π", "0.563π"])
  })

  it("should place literal units after fractions", () => {
    const ticker = ScaledTicker.create({scale: Math.PI/180})
    const formatter = ScaledTickFormatter.create({
      ticker,
      suffix: "°",
      use_fractions: true,
      max_denominator: 2,
    })

    expect(formatter.doFormat([Math.PI/360], {loc: 0})).to.be.equal(["1/2°"])
  })

  it("should preserve numeric coefficients when symbolic style has no suffix", () => {
    const ticker = ScaledTicker.create({scale: 1})
    const formatter = ScaledTickFormatter.create({
      ticker,
      unit_style: "symbolic",
      use_fractions: true,
      max_denominator: 2,
    })

    expect(formatter.doFormat([0.5, 1], {loc: 0})).to.be.equal(["1/2", "1"])
  })

  it("should support literal units that are omitted only at zero", () => {
    const ticker = ScaledTicker.create({scale: 1000})
    const formatter = ScaledTickFormatter.create({
      ticker,
      suffix: "k",
      unit_style: "except_zero",
    })

    expect(formatter.doFormat([0, 1000, 2000], {loc: 0})).to.be.equal(["0", "1k", "2k"])
  })

  it("should preserve rich inner graphics when adding decoration", () => {
    const ticker = ScaledTicker.create({scale: 1})
    const formatter = ScaledTickFormatter.create({
      ticker,
      formatter: LogTickFormatter.create(),
      suffix: "π",
      unit_style: "symbolic",
    })

    const [label] = formatter.format_graphics([100], {loc: 0})
    expect(label).to.be.instanceof(InlineBox)
    const {children} = label as InlineBox
    expect(children[0]).to.be.instanceof(BaseExpo)
    expect(children[1]).to.be.instanceof(TextBox)
    expect((children[1] as TextBox).text).to.be.equal("π")
  })

  it("should propagate changes from the inner formatter and fallback ticker", () => {
    const ticker = ScaledTicker.create({scale: Math.PI})
    const inner = PrintfTickFormatter.create({format: "%.1f"})
    const formatter = ScaledTickFormatter.create({ticker, formatter: inner})
    let changes = 0
    formatter.change.connect(() => changes++)

    inner.format = "%.2f"
    expect(changes).to.be.equal(1)

    ticker.scale = 2
    expect(changes).to.be.equal(2)

    const replacement = PrintfTickFormatter.create({format: "%.3f"})
    formatter.formatter = replacement
    const after_replacement = changes
    inner.format = "%.4f"
    expect(changes).to.be.equal(after_replacement)
    replacement.format = "%.5f"
    expect(changes).to.be.equal(after_replacement + 1)
  })
})
