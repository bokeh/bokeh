import {expect} from "assertions"

import {DateFormatter, NumberFormatter, ScientificFormatter} from "@bokehjs/models/widgets/tables/cell_formatters"

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

      it("should apply nan_format to null", () => {
        const df = new DateFormatter({nan_format: "-"})
        expect(df.doFormat(0, 0, null, {}, {})).to.be.equal('<div class="bk" style="text-align: left;">-</div>')
      })

      it("should apply nan_format to nan", () => {
        const df = new DateFormatter({nan_format: "-"})
        expect(df.doFormat(0, 0, null, {}, {})).to.be.equal('<div class="bk" style="text-align: left;">-</div>')
      })
    })
  })

  describe("NumberFormatter", () => {

    describe("doFormat method", () => {

      it("should apply nan_format to null", () => {
        const df = new NumberFormatter({nan_format: "-"})
        expect(df.doFormat(0, 0, null, {}, {})).to.be.equal('<div class="bk" style="text-align: left;">-</div>')
      })

      it("should apply nan_format to nan", () => {
        const df = new NumberFormatter({nan_format: "-"})
        expect(df.doFormat(0, 0, NaN, {}, {})).to.be.equal('<div class="bk" style="text-align: left;">-</div>')
      })
    })
  })

  describe("ScientificFormatter", () => {

    describe("doFormat method", () => {

      it("should apply nan_format to null", () => {
        const df = new ScientificFormatter({nan_format: "-"})
        expect(df.doFormat(0, 0, null, {}, {})).to.be.equal('<div class="bk" style="text-align: left;">-</div>')
      })

      it("should apply nan_format to nan", () => {
        const df = new ScientificFormatter({nan_format: "-"})
        expect(df.doFormat(0, 0, NaN, {}, {})).to.be.equal('<div class="bk" style="text-align: left;">-</div>')
      })
    })
  })
})
