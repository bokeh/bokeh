{expect} = require "chai"
utils = require "../../../utils"

cf = utils.require("models/widgets/tables/cell_formatters")

describe "cell_formatters module", ->

  describe "DateFormatter", ->

    describe "getFormat method", ->

      it "should map ATOM", ->
        df = new cf.DateFormatter({format: "ATOM"})
        expect(df.getFormat()).to.be.equal "%Y-%m-%d"

      it "should map W3C", ->
        df = new cf.DateFormatter({format: "W3C"})
        expect(df.getFormat()).to.be.equal "%Y-%m-%d"

      it "should map RFC-3339", ->
        df = new cf.DateFormatter({format: "RFC-3339"})
        expect(df.getFormat()).to.be.equal "%Y-%m-%d"

      it "should map ISO-8601", ->
        df = new cf.DateFormatter({format: "ISO-8601"})
        expect(df.getFormat()).to.be.equal "%Y-%m-%d"

      it "should map COOKIE", ->
        df = new cf.DateFormatter({format: "COOKIE"})
        expect(df.getFormat()).to.be.equal "%a, %d %b %Y"

      it "should map RFC-850", ->
        df = new cf.DateFormatter({format: "RFC-850"})
        expect(df.getFormat()).to.be.equal "%A, %d-%b-%y"

      it "should map RFC-1123", ->
        df = new cf.DateFormatter({format: "RFC-1123"})
        expect(df.getFormat()).to.be.equal "%a, %e %b %Y"

      it "should map RFC-2822", ->
        df = new cf.DateFormatter({format: "RFC-2822"})
        expect(df.getFormat()).to.be.equal "%a, %e %b %Y"

      it "should map RSS", ->
        df = new cf.DateFormatter({format: "RSS"})
        expect(df.getFormat()).to.be.equal "%a, %e %b %y"

      it "should map RFC-822", ->
        df = new cf.DateFormatter({format: "RFC-822"})
        expect(df.getFormat()).to.be.equal "%a, %e %b %y"

      it "should map RFC-1036", ->
        df = new cf.DateFormatter({format: "RFC-1036"})
        expect(df.getFormat()).to.be.equal "%a, %e %b %y"

      it "should map TIMESTAMP", ->
        df = new cf.DateFormatter({format: "TIMESTAMP"})
        expect(df.getFormat()).to.be.undefined

      it "should map custom formats to themselves", ->
        df = new cf.DateFormatter({format: "CUST"})
        expect(df.getFormat()).to.be.equal "CUST"
