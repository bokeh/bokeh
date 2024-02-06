import {expect} from "assertions"

import {DateFormatter, NumberFormatter, ScientificFormatter, DynamicFormatter} from "@bokehjs/models/widgets/tables/cell_formatters"

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
      it("should apply default nan_format to null", () => {
        const df = new DateFormatter()
        expect(df.doFormat(0, 0, null, {}, {})).to.be.equal('<div style="text-align: left;">-</div>')
      })

      it("should apply nan_format to null", () => {
        const df = new DateFormatter({nan_format: "--"})
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

  describe("NumberFormatter", () => {

    describe("doFormat method", () => {
      it("should apply default nan_format to null", () => {
        const df = new NumberFormatter()
        expect(df.doFormat(0, 0, null, {}, {})).to.be.equal('<div style="text-align: left;">-</div>')
      })

      it("should apply nan_format to null", () => {
        const df = new NumberFormatter({nan_format: "--"})
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

      it("should apply nan_format to null", () => {
        const df = new ScientificFormatter({nan_format: "--"})
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

  describe("DynamicFormatter functionality", () => {

    it("should apply default formatting correctly", () => {
      const df = new DynamicFormatter()
      const output = df.doFormat(0, 0, "Sample Value", {}, {})
      expect(output).to.be.equal("<div>Sample Value</div>")
    })

    it("should use dataContext for background color", () => {
      const df = new DynamicFormatter({background_color: "background_color"})
      const dataContext = {background_color: "yellow"}
      const output = df.doFormat(0, 0, "Sample Value", {}, dataContext)
      expect(output).to.be.equal('<div style="background: yellow;">Sample Value</div>')
    })

    it("should use dataContext for text color", () => {
      const df = new DynamicFormatter({text_color: "text_color"})
      const dataContext = {text_color: "red"}
      const output = df.doFormat(0, 0, "Sample Value", {}, dataContext)
      expect(output).to.be.equal('<div style="color: red;">Sample Value</div>')
    })

    it("should apply custom value formatting", () => {
      const df = new DynamicFormatter({value_formatting: "<b><%= value %></b>"})
      const output = df.doFormat(0, 0, "Bold Value", {}, {})
      expect(output).to.be.equal("<div><b>Bold Value</b></div>")
    })

    it("should apply background_color as direct color", () => {
      const df = new DynamicFormatter({background_color: "missing_color"})
      const dataContext = {}
      const output = df.doFormat(0, 0, "Sample Value", {}, dataContext)
      expect(output).to.be.equal('<div style="background: missing_color;">Sample Value</div>')
    })

    it("should apply text_color as direct color", () => {
      const df = new DynamicFormatter({text_color: "missing_color"})
      const dataContext = {}
      const output = df.doFormat(0, 0, "Sample Value", {}, dataContext)
      expect(output).to.be.equal('<div style="color: missing_color;">Sample Value</div>')
    })

    it("should apply both background and text color from dataContext", () => {
      const df = new DynamicFormatter({background_color: "background_color", text_color: "text_color"})
      const dataContext = {background_color: "yellow", text_color: "red"}
      const output = df.doFormat(0, 0, "Combined Style", {}, dataContext)
      expect(output).to.be.equal('<div style="background: yellow; color: red;">Combined Style</div>')
    })

    it("should apply background from dataContext and text color as direct value", () => {
      const df = new DynamicFormatter({background_color: "background_color", text_color: "blue"})
      const dataContext = {background_color: "yellow"}
      const output = df.doFormat(0, 0, "Mixed Style", {}, dataContext)
      expect(output).to.be.equal('<div style="background: yellow; color: blue;">Mixed Style</div>')
    })

    it("should apply background as direct value and text color from dataContext", () => {
      const df = new DynamicFormatter({background_color: "green", text_color: "text_color"})
      const dataContext = {text_color: "red"}
      const output = df.doFormat(0, 0, "Mixed Style", {}, dataContext)
      expect(output).to.be.equal('<div style="background: green; color: red;">Mixed Style</div>')
    })

  })

})
