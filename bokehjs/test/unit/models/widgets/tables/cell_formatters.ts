import {expect} from "assertions"

import {DateFormatter, NumberFormatter, ScientificFormatter, StringFormatter} from "@bokehjs/models/widgets/tables/cell_formatters"

describe("cell_formatters module", () => {

  describe("DateFormatter", () => {

    describe("getFormat method", () => {

      it("should map ATOM", () => {
        const df = new DateFormatter({format: "ATOM"})
        expect(df.getFormat()).to.be.equal("%Y-%m-%d")
      })

      it("should map W3C", () => {
        const df = new DateFormatter({format: "W3C"})
        expect(df.getFormat()).to.be.equal("%Y-%m-%d")
      })

      it("should map RFC-3339", () => {
        const df = new DateFormatter({format: "RFC-3339"})
        expect(df.getFormat()).to.be.equal("%Y-%m-%d")
      })

      it("should map ISO-8601", () => {
        const df = new DateFormatter({format: "ISO-8601"})
        expect(df.getFormat()).to.be.equal("%Y-%m-%d")
      })

      it("should map COOKIE", () => {
        const df = new DateFormatter({format: "COOKIE"})
        expect(df.getFormat()).to.be.equal("%a, %d %b %Y")
      })

      it("should map RFC-850", () => {
        const df = new DateFormatter({format: "RFC-850"})
        expect(df.getFormat()).to.be.equal("%A, %d-%b-%y")
      })

      it("should map RFC-1123", () => {
        const df = new DateFormatter({format: "RFC-1123"})
        expect(df.getFormat()).to.be.equal("%a, %e %b %Y")
      })

      it("should map RFC-2822", () => {
        const df = new DateFormatter({format: "RFC-2822"})
        expect(df.getFormat()).to.be.equal("%a, %e %b %Y")
      })

      it("should map RSS", () => {
        const df = new DateFormatter({format: "RSS"})
        expect(df.getFormat()).to.be.equal("%a, %e %b %y")
      })

      it("should map RFC-822", () => {
        const df = new DateFormatter({format: "RFC-822"})
        expect(df.getFormat()).to.be.equal("%a, %e %b %y")
      })

      it("should map RFC-1036", () => {
        const df = new DateFormatter({format: "RFC-1036"})
        expect(df.getFormat()).to.be.equal("%a, %e %b %y")
      })

      it("should map TIMESTAMP", () => {
        const df = new DateFormatter({format: "TIMESTAMP"})
        expect(df.getFormat()).to.be.undefined
      })

      it("should map custom formats to themselves", () => {
        const df = new DateFormatter({format: "CUST"})
        expect(df.getFormat()).to.be.equal("CUST")
      })
    })

    describe("doFormat method", () => {
      it("should apply default null_format to null", () => {
        const df = new DateFormatter()
        expect(df.doFormat(0, 0, null, {}, {})).to.be.equal('<div style="text-align: left;">-</div>')
      })

      it("should apply default nan_format to NaN", () => {
        const df = new DateFormatter()
        expect(df.doFormat(0, 0, NaN, {}, {})).to.be.equal('<div style="text-align: left;">-</div>')
      })

      it("should apply null_format to null", () => {
        const df = new DateFormatter({null_format: "--"})
        expect(df.doFormat(0, 0, null, {}, {})).to.be.equal('<div style="text-align: left;">--</div>')
      })

      it("should apply nan_format to nan", () => {
        const df = new DateFormatter({nan_format: "--"})
        expect(df.doFormat(0, 0, NaN, {}, {})).to.be.equal('<div style="text-align: left;">--</div>')
      })

      it("should apply nan_format to NaT", () => {
        const df = new DateFormatter({nan_format: "--"})
        expect(df.doFormat(0, 0, -9223372036854776, {}, {})).to.be.equal('<div style="text-align: left;">--</div>')
      })
    })
  })

  describe("StringFormatter", () => {

    describe("doFormat method", () => {
      it("should apply default null_format to null", () => {
        const sf = new StringFormatter()
        expect(sf.doFormat(0, 0, null, {}, {})).to.be.equal('<div style="text-align: left;">(null)</div>')
      })

      it("should apply default nan_format to nan", () => {
        const sf = new StringFormatter()
        expect(sf.doFormat(0, 0, NaN, {}, {})).to.be.equal('<div style="text-align: left;">NaN</div>')
      })

      it("should apply null_format to null", () => {
        const sf = new StringFormatter({null_format: "--"})
        expect(sf.doFormat(0, 0, null, {}, {})).to.be.equal('<div style="text-align: left;">--</div>')
      })

      it("should apply nan_format to nan", () => {
        const sf = new StringFormatter({nan_format: "--"})
        expect(sf.doFormat(0, 0, NaN, {}, {})).to.be.equal('<div style="text-align: left;">--</div>')
      })

      it("should apply font_style to value", () => {
        const sf = new StringFormatter({font_style: "bold"})
        expect(sf.doFormat(0, 0, "foo", {}, {})).to.be.equal('<div style="font-weight: bold; text-align: left;">foo</div>')
      })

      it("should apply text_align to value", () => {
        const sf = new StringFormatter({text_align: "center"})
        expect(sf.doFormat(0, 0, "foo", {}, {})).to.be.equal('<div style="text-align: center;">foo</div>')
      })

      it("should apply text_color to value", () => {
        const sf = new StringFormatter({text_color: "#ff22dd"})
        expect(sf.doFormat(0, 0, "foo", {}, {})).to.be.equal('<div style="text-align: left; color: rgb(255, 34, 221);">foo</div>')
      })

      it("should apply background_color to value", () => {
        const sf = new StringFormatter({background_color: "#ff22dd"})
        expect(sf.doFormat(0, 0, "foo", {}, {})).to.be.equal('<div style="text-align: left; background-color: rgb(255, 34, 221);">foo</div>')
      })
    })
  })

  describe("NumberFormatter", () => {

    describe("doFormat method", () => {
      it("should apply default null_format to null", () => {
        const df = new NumberFormatter()
        expect(df.doFormat(0, 0, null, {}, {})).to.be.equal('<div style="text-align: left;">-</div>')
      })

      it("should apply default nan_format to nan", () => {
        const df = new NumberFormatter()
        expect(df.doFormat(0, 0, NaN, {}, {})).to.be.equal('<div style="text-align: left;">-</div>')
      })

      it("should apply null_format to null", () => {
        const df = new NumberFormatter({null_format: "--"})
        expect(df.doFormat(0, 0, null, {}, {})).to.be.equal('<div style="text-align: left;">--</div>')
      })

      it("should apply nan_format to nan", () => {
        const df = new NumberFormatter({nan_format: "--"})
        expect(df.doFormat(0, 0, NaN, {}, {})).to.be.equal('<div style="text-align: left;">--</div>')
      })
    })
  })

  describe("ScientificFormatter", () => {

    describe("doFormat method", () => {
      it("should apply default nan_format to null", () => {
        const df = new ScientificFormatter()
        expect(df.doFormat(0, 0, null, {}, {})).to.be.equal('<div style="text-align: left;">-</div>')
      })

      it("should apply default nan_format to NaN", () => {
        const df = new ScientificFormatter()
        expect(df.doFormat(0, 0, NaN, {}, {})).to.be.equal('<div style="text-align: left;">-</div>')
      })

      it("should apply nan_format to null", () => {
        const df = new ScientificFormatter({null_format: "--"})
        expect(df.doFormat(0, 0, null, {}, {})).to.be.equal('<div style="text-align: left;">--</div>')
      })

      it("should apply nan_format to nan", () => {
        const df = new ScientificFormatter({nan_format: "--"})
        expect(df.doFormat(0, 0, NaN, {}, {})).to.be.equal('<div style="text-align: left;">--</div>')
      })

      it("should apply to_fixed if value is zero", () => {
        const df = new ScientificFormatter({precision: 3})
        expect(df.doFormat(0, 0, 0, {}, {})).to.be.equal('<div style="text-align: left;">0</div>')
      })

      it("should apply to_fixed if value is 10", () => {
        const df = new ScientificFormatter({precision: 10})
        expect(df.doFormat(0, 0, 10, {}, {})).to.be.equal('<div style="text-align: left;">10</div>')
      })

      it("should apply toExponential if value is 1e-8", () => {
        const df = new ScientificFormatter({precision: 3})
        expect(df.doFormat(0, 0, 1e-8, {}, {})).to.be.equal('<div style="text-align: left;">1.000e-8</div>')
      })

      it("should apply to_fixed if value is 0.123456", () => {
        const df = new ScientificFormatter({precision: 3, power_limit_high: 6, power_limit_low: -3})
        expect(df.doFormat(0, 0, 0.123456, {}, {})).to.be.equal('<div style="text-align: left;">0.123</div>')
      })

      it("should apply to_fixed if value is -0.123456", () => {
        const df = new ScientificFormatter({precision: 3, power_limit_high: 6, power_limit_low: -3})
        expect(df.doFormat(0, 0, -0.123456, {}, {})).to.be.equal('<div style="text-align: left;">-0.123</div>')
      })
    })
  })
})
