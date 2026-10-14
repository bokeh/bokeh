import {expect} from "#framework/assertions"

import {BasicTickFormatter} from "@bokehjs/models/formatters/basic_tick_formatter"
import {CustomJSTickFormatter} from "@bokehjs/models/formatters/customjs_tick_formatter"
import {LogTickFormatter} from "@bokehjs/models/formatters/log_tick_formatter"
import {PrintfTickFormatter} from "@bokehjs/models/formatters/printf_tick_formatter"
import {UnitTickFormatter} from "@bokehjs/models/formatters/unit_tick_formatter"
import {BasicTicker} from "@bokehjs/models/tickers/basic_ticker"
import {UnitTicker} from "@bokehjs/models/tickers/unit_ticker"
import {BaseExpo, InlineBox, TextBox} from "@bokehjs/core/graphics"
import {MathML, TeX} from "@bokehjs/models/text/math_text"
import {tex2svg} from "@bokehjs/models/text/mathjax"
import type {BaseText} from "@bokehjs/models/text/base_text"

describe("UnitTickFormatter", () => {
  it("should use a BasicTickFormatter and unit style by default", () => {
    const formatter = UnitTickFormatter.create()
    expect(formatter.ticker).to.be.null
    expect(formatter.formatter).to.be.instanceof(BasicTickFormatter)
    expect(formatter.base_label).to.be.equal("")
    expect(formatter.unit_style).to.be.equal("always")
    expect(formatter.use_fractions).to.be.false
    expect(formatter.fraction_style).to.be.equal("inline")
    expect(formatter.max_denominator).to.be.equal(16)
    expect(formatter.doFormat([0, 1, 2], {loc: 0})).to.be.equal(["0", "1", "2"])
  })

  it("should format symbolic multiples using the axis ticker's scale", () => {
    const ticker = UnitTicker.create({scale: Math.PI})
    const formatter = UnitTickFormatter.create({
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
    const ticker = UnitTicker.create({scale: 1, offset: 10})
    const formatter = UnitTickFormatter.create({
      ticker,
      base_label: "x̄",
      suffix: "σ",
      unit_style: "symbolic",
    })

    expect(formatter.doFormat([7, 9, 10, 11, 13], {loc: 0})).to.be.equal([
      "x̄−3σ", "x̄−σ", "x̄", "x̄+σ", "x̄+3σ",
    ])
  })

  it("should decorate values without requiring a UnitTicker", () => {
    const formatter = UnitTickFormatter.create({suffix: " A", unit_style: "except_zero"})
    expect(formatter.doFormat([0, 1, 2], {loc: 0, ticker: BasicTicker.create()})).to.be.equal(["0", "1 A", "2 A"])
  })

  it("should prefer a scaled axis ticker over the fallback ticker", () => {
    const ticker = UnitTicker.create({scale: Math.PI})
    const fallback = UnitTicker.create({scale: 2})
    const formatter = UnitTickFormatter.create({ticker: fallback, suffix: "π"})

    expect(formatter.doFormat([Math.PI], {loc: 0, ticker})).to.be.equal(["1π"])
  })

  it("should use the fallback ticker when the axis ticker isn't scaled", () => {
    const ticker = BasicTicker.create()
    const fallback = UnitTicker.create({scale: Math.PI})
    const formatter = UnitTickFormatter.create({ticker: fallback, suffix: "π"})

    expect(formatter.doFormat([Math.PI], {loc: 0, ticker})).to.be.equal(["1π"])
  })

  it("should delegate normalized values to another formatter", () => {
    const ticker = UnitTicker.create({scale: Math.PI})
    const formatter = UnitTickFormatter.create({
      ticker,
      formatter: PrintfTickFormatter.create({format: "%.1f"}),
      prefix: "<",
      suffix: "π",
    })

    expect(formatter.doFormat([Math.PI/2], {loc: 0})).to.be.equal(["<0.5π"])
  })

  it("should tolerate floating point noise when omitting one", () => {
    const ticker = UnitTicker.create({scale: Math.PI})
    const formatter = UnitTickFormatter.create({ticker, suffix: "π", unit_style: "symbolic"})

    expect(formatter.doFormat([(1 + Number.EPSILON)*Math.PI], {loc: 0})).to.be.equal(["π"])
  })

  it("should apply omission to the values displayed by the inner formatter", () => {
    const ticker = UnitTicker.create({scale: Math.PI})
    const formatter = UnitTickFormatter.create({
      ticker,
      formatter: PrintfTickFormatter.create({format: "%.0f"}),
      suffix: "π",
      unit_style: "symbolic",
    })

    expect(formatter.doFormat([1e-17*Math.PI, 0.9*Math.PI], {loc: 0})).to.be.equal(["0", "π"])
  })

  it("should use the inner formatter's minus sign", () => {
    const ticker = UnitTicker.create({scale: Math.PI})
    const formatter = UnitTickFormatter.create({
      ticker,
      formatter: PrintfTickFormatter.create({format: "%.0f"}),
      suffix: "π",
      unit_style: "symbolic",
    })

    expect(formatter.doFormat([-Math.PI, -2*Math.PI], {loc: 0})).to.be.equal(["-π", "-2π"])
  })

  it("should display small rational coefficients as fractions", () => {
    const ticker = UnitTicker.create({scale: Math.PI})
    const formatter = UnitTickFormatter.create({
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

  it("should allow for normalization error from large offsets when detecting fractions", () => {
    const offset = 1_700_000_000
    const scale = Math.PI
    const ticker = UnitTicker.create({scale, offset})
    const formatter = UnitTickFormatter.create({
      ticker,
      formatter: PrintfTickFormatter.create({format: "%.3f"}),
      suffix: "π",
      unit_style: "symbolic",
      use_fractions: true,
      max_denominator: 2,
    })

    expect(formatter.doFormat([offset + scale/2], {loc: 0})).to.be.equal(["π/2"])
  })

  it("should use fractions only when every tick can be represented", () => {
    const ticker = UnitTicker.create({scale: Math.PI})
    const formatter = UnitTickFormatter.create({
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
    const ticker = UnitTicker.create({scale: Math.PI/180})
    const formatter = UnitTickFormatter.create({
      ticker,
      suffix: "°",
      use_fractions: true,
      max_denominator: 2,
    })

    expect(formatter.doFormat([Math.PI/360], {loc: 0})).to.be.equal(["1/2°"])
  })

  it("should preserve numeric coefficients when symbolic style has no suffix", () => {
    const ticker = UnitTicker.create({scale: 1})
    const formatter = UnitTickFormatter.create({
      ticker,
      unit_style: "symbolic",
      use_fractions: true,
      max_denominator: 2,
    })

    expect(formatter.doFormat([0.5, 1], {loc: 0})).to.be.equal(["1/2", "1"])
  })

  it("should support literal units that are omitted only at zero", () => {
    const ticker = UnitTicker.create({scale: 1000})
    const formatter = UnitTickFormatter.create({
      ticker,
      suffix: "k",
      unit_style: "except_zero",
    })

    expect(formatter.doFormat([0, 1000, 2000], {loc: 0})).to.be.equal(["0", "1k", "2k"])
  })

  it("should preserve rich inner graphics when adding decoration", () => {
    const ticker = UnitTicker.create({scale: 1})
    const formatter = UnitTickFormatter.create({
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

  it("should escape arbitrary inner formatter output in TeX labels", () => {
    const inner = CustomJSTickFormatter.create({code: "return String.raw`$a_b#c%d&e\\f`"})
    const formatter = UnitTickFormatter.create({
      formatter: inner,
      suffix: TeX.create({text: "\\pi"}),
    })
    const resolved: BaseText[] = []
    formatter.format_graphics([1], {
      loc: 0,
      resolve_text(text) {
        resolved.push(text)
        return new TextBox({text: text.text})
      },
    })

    expect(resolved.length).to.be.equal(1)
    expect(resolved[0]).to.be.instanceof(TeX)
    expect(resolved[0].text).to.be.equal("\\text{\\$a\\_b\\#c\\%d\\&e}\\backslash{}\\text{f}\\pi")
    const svg = tex2svg(resolved[0].text)
    expect(svg.querySelector('[data-mml-node="merror"]')).to.be.null
    expect(svg.querySelector('[mathcolor="red"]')).to.be.null
  })

  it("should keep generated TeX labels isolated between formatter contexts", () => {
    const formatter = UnitTickFormatter.create({suffix: TeX.create({text: "\\pi"})})
    const first: BaseText[] = []
    const second: BaseText[] = []
    const first_context = {
      loc: 0,
      resolve_text(text: BaseText) {
        first.push(text)
        return new TextBox({text: text.text})
      },
    }
    const second_context = {
      loc: 0,
      resolve_text(text: BaseText) {
        second.push(text)
        return new TextBox({text: text.text})
      },
    }

    formatter.format_graphics([2], first_context)
    formatter.format_graphics([3], second_context)
    formatter.format_graphics([2], first_context)

    expect(first.length).to.be.equal(2)
    expect(second.length).to.be.equal(1)
    expect(first[1]).to.be.equal(first[0])
    expect(second[0]).to.not.be.equal(first[0])
  })

  it("should bound generated TeX labels in each formatter context", () => {
    const formatter = UnitTickFormatter.create({suffix: TeX.create({text: "\\pi"})})
    const context = {
      loc: 0,
      resolve_text(text: BaseText) {
        return new TextBox({text: text.text})
      },
    }
    for (let i = 0; i < 140; i++) {
      formatter.format_graphics([i + 0.25], context)
    }

    const tex_models = formatter.get_text_models(context).filter((model) => model instanceof TeX)
    expect(tex_models.length).to.be.equal(129) // The suffix plus 128 generated labels.
  })

  it("should discard generated TeX labels when formatting changes", () => {
    const formatter = UnitTickFormatter.create({suffix: TeX.create({text: "\\pi"})})
    const context = {
      loc: 0,
      resolve_text(text: BaseText) {
        return new TextBox({text: text.text})
      },
    }

    formatter.format_graphics([2], context)
    expect(formatter.get_text_models(context).filter((model) => model instanceof TeX).length).to.be.equal(2)

    const suffix = TeX.create({text: "\\tau"})
    formatter.suffix = suffix
    const after_change = formatter.get_text_models(context).filter((model) => model instanceof TeX)
    expect(after_change).to.be.equal([suffix])
  })

  it("should compose mixed TeX and MathML decorations separately", () => {
    const formatter = UnitTickFormatter.create({
      prefix: TeX.create({text: "\\alpha"}),
      suffix: MathML.create({text: "<math><mi>m</mi></math>"}),
    })
    const resolved: BaseText[] = []
    const [label] = formatter.format_graphics([2], {
      loc: 0,
      resolve_text(text) {
        resolved.push(text)
        return new TextBox({text: text.text})
      },
    })

    expect(label).to.be.instanceof(InlineBox)
    expect(resolved.length).to.be.equal(2)
    expect(resolved[0]).to.be.instanceof(TeX)
    expect(resolved[1]).to.be.instanceof(MathML)
  })

  it("should propagate changes from the inner formatter and fallback ticker", () => {
    const ticker = UnitTicker.create({scale: Math.PI})
    const inner = PrintfTickFormatter.create({format: "%.1f"})
    const formatter = UnitTickFormatter.create({ticker, formatter: inner})
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
