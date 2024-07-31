import {expect} from "assertions"

import {CustomJSTicker} from "@bokehjs/models/tickers/customjs_ticker"
import type {FactorTickSpec} from "@bokehjs/models/tickers/categorical_ticker"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {Range1d} from "@bokehjs/models/ranges/range1d"

describe("CustomJSTicker Model", () => {

  describe("Continuous get_ticks method", () => {
    it("should handle case with no major_code", () => {
      const ticker = new CustomJSTicker()
      const range = new Range1d({start: -1, end: 11})
      const ticks = ticker.get_ticks(0, 10, range, NaN)
      expect(ticks.major).to.be.equal([])
      expect(ticks.minor).to.be.equal([])
    })

    it("should return major_code result", () => {
      const ticker = new CustomJSTicker({major_code: "return [2,4,6,8]"})
      const range = new Range1d({start: -1, end: 11})
      const ticks = ticker.get_ticks(0, 10, range, NaN)
      expect(ticks.major).to.be.equal([2, 4, 6, 8])
      expect(ticks.minor).to.be.equal([])
    })

    it("should pass start and end to major_code", () => {
      const ticker = new CustomJSTicker({major_code: "return [cb_data.start, cb_data.end]"})
      const range = new Range1d({start: -1, end: 11})
      const ticks = ticker.get_ticks(0, 10, range, NaN)
      expect(ticks.major).to.be.equal([0, 10])
      expect(ticks.minor).to.be.equal([])
    })

    it("should pass range to major_code", () => {
      const ticker = new CustomJSTicker({major_code: "return [cb_data.range.start, cb_data.range.end]"})
      const range = new Range1d({start: -1, end: 11})
      const ticks = ticker.get_ticks(0, 10, range, NaN)
      expect(ticks.major).to.be.equal([-1, 11])
      expect(ticks.minor).to.be.equal([])
    })

    it("should pass cross_loc to major_code", () => {
      const ticker = new CustomJSTicker({major_code: "return [cb_data.cross_loc]"})
      const range = new Range1d({start: -1, end: 11})
      const ticks = ticker.get_ticks(0, 10, range, 20)
      expect(ticks.major).to.be.equal([20])
      expect(ticks.minor).to.be.equal([])
    })

  })

  describe("Categorical get_ticks method", () => {

    it("should handle case with no major_code", () => {
      const ticker = new CustomJSTicker()
      const range = new FactorRange({factors: ["foo", "bar", "baz"]})
      const ticks = ticker.get_ticks(0, 10, range, NaN) as FactorTickSpec
      expect(ticks.major).to.be.equal([])
      expect(ticks.minor).to.be.equal([])
      expect(ticks.mids).to.be.equal([])
      expect(ticks.tops).to.be.equal([])
    })

    it("should handle case where range has factors", () => {
      const ticker = new CustomJSTicker({major_code: "return['foo', 'baz']"})
      const range = new FactorRange({factors: ["foo", "bar", "baz"]})
      const ticks = ticker.get_ticks(0, 3, range, NaN) as FactorTickSpec
      expect(ticks.major).to.be.equal(["foo", "baz"])
      expect(ticks.minor).to.be.equal([])
      expect(ticks.mids).to.be.equal([])
      expect(ticks.tops).to.be.equal([])
    })

    it("should pass start and end to major_code", () => {
      const ticker = new CustomJSTicker({major_code: "return [cb_data.start.toString(), cb_data.end.toString()]"})
      const range = new FactorRange({factors: ["foo", "bar", "baz"]})
      const ticks = ticker.get_ticks(0, 10, range, NaN) as FactorTickSpec
      expect(ticks.major).to.be.equal(["0", "10"])
      expect(ticks.minor).to.be.equal([])
      expect(ticks.mids).to.be.equal([])
      expect(ticks.tops).to.be.equal([])
    })

    it("should pass range to major_code", () => {
      const ticker = new CustomJSTicker({major_code: "return cb_data.range.factors"})
      const range = new FactorRange({factors: ["foo", "bar", "baz"]})
      const ticks = ticker.get_ticks(0, 10, range, NaN) as FactorTickSpec
      expect(ticks.major).to.be.equal(["foo", "bar", "baz"])
      expect(ticks.minor).to.be.equal([])
      expect(ticks.mids).to.be.equal([])
      expect(ticks.tops).to.be.equal([])
    })

    it("should pass cross_loc to major_code", () => {
      const ticker = new CustomJSTicker({major_code: "return [cb_data.cross_loc.toString()]"})
      const range = new FactorRange({factors: ["foo", "bar", "baz"]})
      const ticks = ticker.get_ticks(0, 10, range, 20) as FactorTickSpec
      expect(ticks.major).to.be.equal(["20"])
      expect(ticks.minor).to.be.equal([])
      expect(ticks.mids).to.be.equal([])
      expect(ticks.tops).to.be.equal([])
    })

  })
})
