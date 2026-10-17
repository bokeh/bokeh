import * as sinon from "sinon"
import {expect} from "#framework/assertions"

import {InlineBox, TextBox} from "@bokehjs/core/graphics"
import {logger} from "@bokehjs/core/logging"
import {BasicTickFormatter} from "@bokehjs/models/formatters/basic_tick_formatter"
import {PrintfTickFormatter} from "@bokehjs/models/formatters/printf_tick_formatter"
import {ScaledTickFormatter} from "@bokehjs/models/formatters/scaled_tick_formatter"
import {SITickFormatter} from "@bokehjs/models/formatters/si_tick_formatter"
import type {BaseText} from "@bokehjs/models/text/base_text"
import {TeX} from "@bokehjs/models/text/math_text"
import {tex2svg} from "@bokehjs/models/text/mathjax"

describe("SITickFormatter", () => {
  it("should use a BasicTickFormatter and automatic prefix by default", () => {
    const formatter = SITickFormatter.create()
    expect(formatter.formatter).to.be.instanceof(BasicTickFormatter)
    expect(formatter.unit).to.be.equal("")
    expect(formatter.prefix).to.be.equal("auto")
    expect(formatter.unit_style).to.be.equal("always")
    expect(formatter.doFormat([0, 1, 2], {loc: 0})).to.be.equal(["0", "1", "2"])
  })

  it("should select one engineering prefix for all visible ticks", () => {
    const formatter = SITickFormatter.create({unit: "Hz"})

    expect(formatter.doFormat([0, 1e6, 2.5e6], {loc: 0})).to.be.equal([
      "0 MHz", "1 MHz", "2.5 MHz",
    ])
  })

  it("should select prefixes for small values", () => {
    const formatter = SITickFormatter.create({unit: "s"})

    expect(formatter.doFormat([0, 1e-6, 2e-6], {loc: 0})).to.be.equal([
      "0 µs", "1 µs", "2 µs",
    ])
  })

  it("should leave exact zero undecorated when requested", () => {
    const formatter = SITickFormatter.create({unit: "Hz", prefix: "k", unit_style: "except_zero"})

    expect(formatter.doFormat([-0, 1e3], {loc: 0})).to.be.equal(["0", "1 kHz"])

    const graphics = formatter.format_graphics([0, 1e3], {loc: 0})
    expect(graphics[0]).to.be.instanceof(TextBox)
    expect((graphics[0] as TextBox).text).to.be.equal("0")
    expect(graphics[1]).to.be.instanceof(InlineBox)
    expect((graphics[1] as InlineBox).children.map((child) => (child as TextBox).text)).to.be.equal(["1", " kHz"])
  })

  it("should tolerate floating point noise at engineering boundaries", () => {
    const formatter = SITickFormatter.create({unit: "Hz"})
    const intended_nanosecond = 100*1e-11

    expect(intended_nanosecond).to.be.below(1e-9)
    expect(formatter.doFormat([9.5e-10, intended_nanosecond], {loc: 0})).to.be.equal([
      "0.95 nHz", "1 nHz",
    ])
    expect(formatter.doFormat([999.999, 999.999999], {loc: 0}).every((label) => label.endsWith(" Hz"))).to.be.true
    expect(formatter.doFormat([999.999, 1000], {loc: 0}).every((label) => label.endsWith(" kHz"))).to.be.true
  })

  it("should select prefixes from finite absolute values and clamp at the supported extremes", () => {
    const formatter = SITickFormatter.create({unit: "s"})

    expect(formatter.doFormat([-2e6, -1e6], {loc: 0})).to.be.equal(["−2 Ms", "−1 Ms"])
    expect(formatter.doFormat([0, 0], {loc: 0})).to.be.equal(["0 s", "0 s"])
    expect(formatter.doFormat([NaN, Infinity, 2e3], {loc: 0}).every((label) => label.endsWith(" ks"))).to.be.true
    expect(formatter.doFormat([1e33], {loc: 0})).to.be.equal(["1000 Qs"])
    expect(formatter.doFormat([1e-33], {loc: 0})).to.be.equal(["1.000e−3 qs"])
  })

  it("should allow a fixed prefix", () => {
    const formatter = SITickFormatter.create({
      formatter: PrintfTickFormatter.create({format: "%.1f"}),
      unit: "Hz",
      prefix: "k",
    })

    expect(formatter.doFormat([1e6, 2e6], {loc: 0})).to.be.equal(["1000.0 kHz", "2000.0 kHz"])
  })

  it("should allow prefix scaling to be disabled", () => {
    const formatter = SITickFormatter.create({unit: "Hz", prefix: null})
    expect(formatter.doFormat([1e6], {loc: 0})).to.be.equal(["1.000e+6 Hz"])
  })

  it("should select automatic prefixes from the values in each formatting call", () => {
    const formatter = SITickFormatter.create({unit: "Hz"})

    expect(formatter.compute(500)).to.be.equal("500 Hz")
    expect(formatter.compute(1500)).to.be.equal("1.5 kHz")
    expect(formatter.v_compute([0, 500, 1500])).to.be.equal(["0 kHz", "0.5 kHz", "1.5 kHz"])
  })

  it("should not mutate the caller's tick vector", () => {
    const formatter = SITickFormatter.create({unit: "Hz"})
    const ticks = [0, 1e6, 2e6]
    const copy = [...ticks]

    formatter.doFormat(ticks, {loc: 0})
    formatter.format_graphics(ticks, {loc: 0})
    expect(ticks).to.be.equal(copy)
  })

  it("should use the plain-string graphics fast path", () => {
    const formatter = SITickFormatter.create({unit: "Hz"})
    let resolved = 0
    const [label] = formatter.format_graphics([1e6], {
      loc: 0,
      resolve_text() {
        resolved++
        return null
      },
    })

    expect(formatter.get_text_models()).to.be.empty
    expect(resolved).to.be.equal(0)
    expect(label).to.be.instanceof(InlineBox)
    expect((label as InlineBox).children.map((child) => (child as TextBox).text)).to.be.equal(["1", " MHz"])
  })

  it("should render complete labels as TeX when the unit is TeX", () => {
    const unit = TeX.create({text: "\\mathrm{Hz}"})
    const formatter = SITickFormatter.create({unit})
    const resolved: BaseText[] = []
    const context = {
      loc: 0,
      resolve_text(text: BaseText) {
        resolved.push(text)
        return new TextBox({text: text.text})
      },
    }
    const [label] = formatter.format_graphics([1e6], context)

    expect(formatter.get_text_models()).to.be.equal([unit])
    expect(resolved.length).to.be.equal(1)
    expect(resolved[0]).to.be.instanceof(TeX)
    expect(resolved[0].text).to.be.equal("\\text{1}\\,\\mathrm{M}\\mathrm{Hz}")
    expect(formatter.get_text_models(context)).to.be.equal([unit, resolved[0]])
    expect(label).to.be.instanceof(TextBox)
    const svg = tex2svg(resolved[0].text)
    expect(svg.querySelector('[data-mml-node="merror"]')).to.be.null
  })

  it("should recognize delimited TeX units", () => {
    const formatter = SITickFormatter.create({unit: "$$\\mathrm{Hz}$$"})
    const [unit] = formatter.get_text_models()
    const resolved: BaseText[] = []
    formatter.format_graphics([1e3], {
      loc: 0,
      resolve_text(text) {
        resolved.push(text)
        return new TextBox({text: text.text})
      },
    })

    expect(resolved.length).to.be.equal(1)
    expect(unit).to.be.instanceof(TeX)
    expect(unit.text).to.be.equal("\\mathrm{Hz}")
    expect(resolved[0]).to.be.instanceof(TeX)
    expect(resolved[0].text).to.be.equal("\\text{1}\\,\\mathrm{k}\\mathrm{Hz}")
  })

  it("should compose a fallback while a complete TeX label is pending", () => {
    const unit = TeX.create({text: "\\mathrm{Hz}"})
    const formatter = SITickFormatter.create({unit, prefix: "M"})
    const resolved: BaseText[] = []
    const [label] = formatter.format_graphics([1e6], {
      loc: 0,
      resolve_text(text) {
        resolved.push(text)
        return text === unit ? new TextBox({text: "rendered unit"}) : null
      },
    })

    expect(resolved.length).to.be.equal(2)
    expect(resolved[0]).to.be.instanceof(TeX)
    expect(resolved[0].text).to.be.equal("\\text{1}\\,\\mathrm{M}\\mathrm{Hz}")
    expect(resolved[1]).to.be.equal(unit)
    expect(label).to.be.instanceof(InlineBox)
    expect((label as InlineBox).children.map((child) => (child as TextBox).text)).to.be.equal([
      "1", " M", "rendered unit",
    ])
  })

  it("should render the micro prefix upright in TeX labels", () => {
    const formatter = SITickFormatter.create({unit: TeX.create({text: "\\mathrm{Hz}"}), prefix: "µ"})
    const resolved: BaseText[] = []
    formatter.format_graphics([1e-6], {
      loc: 0,
      resolve_text(text) {
        resolved.push(text)
        return new TextBox({text: text.text})
      },
    })

    expect(resolved.length).to.be.equal(1)
    expect(resolved[0].text).to.be.equal("\\text{1}\\,\\text{µ}\\mathrm{Hz}")
    const svg = tex2svg(resolved[0].text)
    expect(svg.querySelector('[data-mml-node="merror"]')).to.be.null
  })

  it("should leave exact zero outside TeX unit labels when requested", () => {
    const formatter = SITickFormatter.create({
      unit: "$$\\mathrm{Hz}$$",
      prefix: "M",
      unit_style: "except_zero",
    })
    const resolved: BaseText[] = []
    const context = {
      loc: 0,
      resolve_text(text: BaseText) {
        resolved.push(text)
        return new TextBox({text: text.text})
      },
    }
    const labels = formatter.format_graphics([0, 1e6], context)
    const [unit] = formatter.get_text_models()

    expect(labels[0]).to.be.instanceof(TextBox)
    expect((labels[0] as TextBox).text).to.be.equal("0")
    expect(resolved.length).to.be.equal(1)
    expect(resolved[0]).to.be.instanceof(TeX)
    expect(resolved[0].text).to.be.equal("\\text{1}\\,\\mathrm{M}\\mathrm{Hz}")
    expect(formatter.get_text_models(context)).to.be.equal([unit, resolved[0]])
  })

  it("should not resolve an empty rich-text unit", () => {
    const formatter = SITickFormatter.create({unit: TeX.create({text: ""}), prefix: "k"})
    let resolved = 0
    formatter.format_graphics([1e3], {
      loc: 0,
      resolve_text() {
        resolved++
        return null
      },
    })

    expect(formatter.get_text_models()).to.be.empty
    expect(resolved).to.be.equal(0)
  })

  it("should log once and use a nested ScaledTickFormatter directly", () => {
    class DerivedScaledTickFormatter extends ScaledTickFormatter {}
    const inner = DerivedScaledTickFormatter.create({unit: " scaled"})
    const expected = inner.doFormat([1], {loc: 0})
    const formatter = SITickFormatter.create({formatter: inner, unit: "Hz", prefix: "k"})
    const logger_spy = sinon.spy(logger, "error")
    try {
      expect(formatter.doFormat([1], {loc: 0})).to.be.equal(expected)
      expect(formatter.doFormat([1], {loc: 0})).to.be.equal(expected)
      const [graphic] = formatter.format_graphics([1], {loc: 0})
      expect(graphic).to.be.instanceof(InlineBox)
      expect((graphic as InlineBox).children.map((child) => (child as TextBox).text)).to.be.equal([
        "1", " scaled",
      ])
      expect(logger_spy.calledOnceWith(
        "SITickFormatter and ScaledTickFormatter cannot be nested; using the inner formatter only",
      )).to.be.true
    } finally {
      logger_spy.restore()
    }
  })

  it("should propagate changes from the inner formatter", () => {
    const inner = PrintfTickFormatter.create({format: "%.1f"})
    const formatter = SITickFormatter.create({formatter: inner, unit: "Hz"})
    let changes = 0
    formatter.change.connect(() => changes++)

    inner.format = "%.2f"
    expect(changes).to.be.equal(1)

    const replacement = PrintfTickFormatter.create({format: "%.3f"})
    formatter.formatter = replacement
    const after_replacement = changes
    inner.format = "%.4f"
    expect(changes).to.be.equal(after_replacement)
    replacement.format = "%.5f"
    expect(changes).to.be.equal(after_replacement + 1)
  })

  it("should propagate changes from a rich-text unit", () => {
    const unit = TeX.create({text: "\\mathrm{Hz}"})
    const formatter = SITickFormatter.create({unit})
    let changes = 0
    formatter.change.connect(() => changes++)

    unit.macros = {Hz: "\\mathrm{Hz}"}
    expect(changes).to.be.equal(1)

    const replacement = TeX.create({text: "\\mathrm{s}"})
    formatter.unit = replacement
    const after_replacement = changes
    unit.macros = {}
    expect(changes).to.be.equal(after_replacement)
    replacement.macros = {s: "\\mathrm{s}"}
    expect(changes).to.be.equal(after_replacement + 1)
  })
})
