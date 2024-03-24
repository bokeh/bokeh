import {expect} from "assertions"

import * as dttf from "@bokehjs/models/formatters/datetime_tick_formatter"

describe("resolution_order", () => {
  it("should list resolutions in ascending order", () => {
    const expected: dttf.ResolutionType[] = [
      "microseconds", "milliseconds", "seconds", "minsec", "minutes", "hourmin", "hours", "days", "months", "years",
    ]
    expect(dttf.resolution_order).to.be.equal(expected)
  })
})

describe("tm_index_for_resolution", () => {
  for (const resolution of ["microseconds", "milliseconds", "days", "months", "years"]) {
    it(`should map ${resolution}`, () => {
      expect(dttf.tm_index_for_resolution.milliseconds).to.be.equal(0)
    })
  }
  it("should map seconds", () => {
    expect(dttf.tm_index_for_resolution.seconds).to.be.equal(5)
  })
  it("should map minsec", () => {
    expect(dttf.tm_index_for_resolution.minsec).to.be.equal(4)
  })
  it("should map minutes", () => {
    expect(dttf.tm_index_for_resolution.minutes).to.be.equal(4)
  })
  it("should map hourmin", () => {
    expect(dttf.tm_index_for_resolution.hourmin).to.be.equal(3)
  })
  it("should map hours", () => {
    expect(dttf.tm_index_for_resolution.hours).to.be.equal(3)
  })
})

describe("_get_resolution", () => {
  it("should handle microseconds", () => {
    const low = 0
    const high = 0.001 / 1.11
    expect(dttf._get_resolution(low, 1)).to.be.equal("microseconds")
    expect(dttf._get_resolution(high, 1)).to.be.equal("microseconds")
  })
  it("should handle milliseconds", () => {
    const low  = 0.001 / 1.09
    const high  = 1 / 1.11
    expect(dttf._get_resolution(low, 1)).to.be.equal("milliseconds")
    expect(dttf._get_resolution(high, 1)).to.be.equal("milliseconds")
  })
  it("should handle seconds", () => {
    const low = 1 / 1.09
    const high = 60 / 1.11
    expect(dttf._get_resolution(low, 0)).to.be.equal("seconds")
    expect(dttf._get_resolution(low, 59)).to.be.equal("seconds")
    expect(dttf._get_resolution(high, 0)).to.be.equal("seconds")
    expect(dttf._get_resolution(high, 59)).to.be.equal("seconds")
  })
  it("should handle minsec", () => {
    const low = 1 / 1.09
    const high = 60 / 1.11
    expect(dttf._get_resolution(low, 60)).to.be.equal("minsec")
    expect(dttf._get_resolution(high, 60)).to.be.equal("minsec")
  })
  it("should handle minutes", () => {
    const low = 60 / 1.09
    const high = 60 * 60 / 1.11
    expect(dttf._get_resolution(low, 0)).to.be.equal("minutes")
    expect(dttf._get_resolution(low, 3599)).to.be.equal("minutes")
    expect(dttf._get_resolution(high, 0)).to.be.equal("minutes")
    expect(dttf._get_resolution(high, 3599)).to.be.equal("minutes")
  })
  it("should handle hourmin", () => {
    const low = 60 / 1.09
    const high = 60 * 60 / 1.11
    expect(dttf._get_resolution(low, 3600)).to.be.equal("hourmin")
    expect(dttf._get_resolution(high, 3600)).to.be.equal("hourmin")
  })
  it("should handle hours", () => {
    const low = 60 * 60 / 1.09
    const high = 60 * 60 * 24 / 1.11
    expect(dttf._get_resolution(low, 1)).to.be.equal("hours")
    expect(dttf._get_resolution(high, 1)).to.be.equal("hours")
  })
  it("should handle days", () => {
    const low = 60 * 60 * 24 / 1.09
    const high = 60 * 60 * 24  * 30 / 1.11
    expect(dttf._get_resolution(low, 1)).to.be.equal("days")
    expect(dttf._get_resolution(high, 1)).to.be.equal("days")
  })
  it("should handle months", () => {
    const low = 60 * 60 * 24 * 30 / 1.09
    const high = 60 * 60 * 24 * 365 / 1.11
    expect(dttf._get_resolution(low, 1)).to.be.equal("months")
    expect(dttf._get_resolution(high, 1)).to.be.equal("months")
  })
  it("should handle years", () => {
    const low = 60 * 60 * 24 * 365 / 1.09
    expect(dttf._get_resolution(low, 1)).to.be.equal("years")
  })
})

describe("_mktime", () => {
  it("should return tm struct", () => {
    const t = 1655945719752  // Thu, 23 Jun 2022 00:55:19 GMT
    const tm = dttf._mktime(t)
    expect(tm.length).to.be.equal(6)
    expect(tm[0]).to.be.equal(2022)
    expect(tm[1]).to.be.equal(6)
    expect(tm[2]).to.be.equal(23)
    expect(tm[3]).to.be.equal(0)
    expect(tm[4]).to.be.equal(55)
    expect(tm[5]).to.be.equal(19)
  })
})

describe("_strftime", () => {
  it("should handle no format", () => {
    const t = 1655945719752  // Thu, 23 Jun 2022 00:55:19 GMT
    expect(dttf._strftime(t, "foo")).to.be.equal("foo")
  })
  it("should handle no microseconds", () => {
    const t = 123456789.1234
    expect(dttf._strftime(t, "%f")).to.be.equal("789123")
  })
  it("should delegate to tz otherwise", () => {
    const t = 1655945719752  // Thu, 23 Jun 2022 00:55:19 GMT
    expect(dttf._strftime(t, "%Y %m %d %H %M %S")).to.be.equal("2022 06 23 00 55 19")
  })
})

describe("_us", () => {
  it("should round microseconds", () => {
    expect(dttf._us(123456789.1234)).to.be.equal(789123)
  })
  it("should handle negative microseconds (pre epoch)", () => {
    expect(dttf._us(-123456789.1234)).to.be.equal(210877)
  })
})

const t = 1655945719752  // Thu, 23 Jun 2022 00:55:19 GMT
const MIN = 60 * 1000
const HOUR = 3600 * 1000
const DAY = 3600 * 24 * 1000
const MONTH = 3600 * 24 * 30 * 1000
const YEAR = 3600 * 24 * 365 * 1000

describe("DatetimeTickFormatter", () => {
  describe("doFormat method", () => {
    it("should handle empty list", () => {
      const formatter = new dttf.DatetimeTickFormatter()
      const labels = formatter.doFormat([], {loc: 0})
      expect(labels).to.be.equal([])
    })
    it("should handle microseconds", () => {
      const formatter = new dttf.DatetimeTickFormatter()
      const labels = formatter.doFormat([t, t+0.001, t+0.002], {loc: 0})
      expect(labels).to.be.equal(["752000us", "752001us", "752002us"])
    })
    it("should handle milliseconds", () => {
      const formatter = new dttf.DatetimeTickFormatter()
      const labels = formatter.doFormat([t, t+1, t+2], {loc: 0})
      expect(labels).to.be.equal(["752ms", "753ms", "754ms"])
    })
    it("should handle seconds", () => {
      const formatter = new dttf.DatetimeTickFormatter()
      const labels = formatter.doFormat([t, t+1000, t+2000], {loc: 0})
      expect(labels).to.be.equal(["19s", "20s", "21s"])
    })
    it("should handle minsec", () => {
      const formatter = new dttf.DatetimeTickFormatter()
      const labels = formatter.doFormat([t, t+50000, t+100000], {loc: 0})
      expect(labels).to.be.equal([":55:19", ":56:09", ":56:59"])
    })
    it("should handle minutes", () => {
      const formatter = new dttf.DatetimeTickFormatter()
      const labels = formatter.doFormat([t, t+MIN, t+MIN*2], {loc: 0})
      expect(labels).to.be.equal([":55", ":56", ":57"])
    })
    it("should handle hourmin", () => {
      const formatter = new dttf.DatetimeTickFormatter()
      const labels = formatter.doFormat([t, t+MIN*30, t+MIN*60], {loc: 0})
      expect(labels).to.be.equal([":55", "01:25", "01:55"])
    })
    it("should handle hours", () => {
      const formatter = new dttf.DatetimeTickFormatter()
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      // happens to test near day boundary
      expect(labels).to.be.equal(["06/23", "01h", "02h"])
    })
    it("should handle days", () => {
      const formatter = new dttf.DatetimeTickFormatter()
      const labels = formatter.doFormat([t, t+DAY, t+DAY*2], {loc: 0})
      expect(labels).to.be.equal(["06/23", "06/24", "06/25"])
    })
    it("should handle months", () => {
      const formatter = new dttf.DatetimeTickFormatter()
      const labels = formatter.doFormat([t, t+MONTH, t+MONTH*2], {loc: 0})
      expect(labels).to.be.equal(["06/2022", "07/2022", "08/2022"])
    })
    it("should handle years", () => {
      const formatter = new dttf.DatetimeTickFormatter()
      const labels = formatter.doFormat([t, t+YEAR, t+YEAR*2], {loc: 0})
      expect(labels).to.be.equal(["2022", "2023", "2024"])
    })
  })

  describe("strip_leading_zeros", () => {
    it("should handle boolean", () => {
      const formatter = new dttf.DatetimeTickFormatter({strip_leading_zeros: true})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["6/23", "1h", "2h"])
    })
    it("should handle resolution type hours", () => {
      const formatter = new dttf.DatetimeTickFormatter({strip_leading_zeros: ["hours"]})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["06/23", "1h", "2h"])
    })
    it("should handle resolution type days", () => {
      const formatter = new dttf.DatetimeTickFormatter({strip_leading_zeros: ["days"]})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["6/23", "01h", "02h"])
    })
    it("should handle resolution type milliseconds", () => {
      const formatter = new dttf.DatetimeTickFormatter({strip_leading_zeros: ["milliseconds"]})
      const labels = formatter.doFormat([t-752, t-747, t-742], {loc: 0})
      expect(labels).to.be.equal(["0ms", "5ms", "10ms"])
    })
  })
  describe("boundary_scaling", () => {
    it("should handle boolean", () => {
      const formatter = new dttf.DatetimeTickFormatter({boundary_scaling: false})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["00h", "01h", "02h"])
    })
  })
  describe("hide_repeats", () => {
    it("should handle boolean", () => {
      const formatter = new dttf.DatetimeTickFormatter({hours: "%m/%d", hide_repeats: true})
      const labels = formatter.doFormat([t+HOUR, t+HOUR*2, t+HOUR*3], {loc: 0})
      expect(labels).to.be.equal(["06/23", "", ""])
    })
    it("should handle boolean within context", () => {
      const context = new dttf.DatetimeTickFormatter({
        microseconds: "microseconds",
        milliseconds: "milliseconds",
        seconds: "s",
        minsec: "minsec",
        minutes: "minutes",
        hourmin: "hourmin",
        hours: "hours",
        days: "days",
        months: "months",
        years: "years",
        hide_repeats: true})
      const formatter = new dttf.DatetimeTickFormatter({context, context_which: "all"})
      const labels = formatter.doFormat([t, t+YEAR, t+YEAR*2], {loc: 0})
      expect(labels).to.be.equal(["2022\nyears", "2023\n", "2024\n"])
    })
  })
  describe("context", () => {
    it("should handle plain string", () => {
      const formatter = new dttf.DatetimeTickFormatter({context: "FOO"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["06/23\nFOO", "01h\n", "02h\n"])
    })
    it("should handle a format string", () => {
      const formatter = new dttf.DatetimeTickFormatter({context: "%Y"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["06/23\n2022", "01h\n", "02h\n"])
    })
    it("should handle a DatetimeTickFormatter", () => {
      const context = new dttf.DatetimeTickFormatter({
        microseconds: "microseconds",
        milliseconds: "milliseconds",
        seconds: "s",
        minsec: "minsec",
        minutes: "minutes",
        hourmin: "hourmin",
        hours: "hours",
        days: "days",
        months: "months",
        years: "years"})
      const formatter = new dttf.DatetimeTickFormatter({context})

      // A tick formatter used for context will format according to the "parent" resolution
      const us_labels = formatter.doFormat([t, t+0.001, t+0.002], {loc: 0})
      expect(us_labels).to.be.equal(["752000us\nmicroseconds", "752001us\n", "752002us\n"])

      const days_labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(days_labels).to.be.equal(["06/23\ndays", "01h\n", "02h\n"])

      const years_labels = formatter.doFormat([t, t+YEAR, t+YEAR*2], {loc: 0})
      expect(years_labels).to.be.equal(["2022\nyears", "2023\n", "2024\n"])
    })
  })
  describe("context_which", () => {
    it("should handle start", () => {
      const formatter = new dttf.DatetimeTickFormatter({context: "%Y", context_which: "start"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["06/23\n2022", "01h\n", "02h\n"])
    })
    it("should handle end", () => {
      const formatter = new dttf.DatetimeTickFormatter({context: "%Y", context_which: "end"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["06/23\n", "01h\n", "02h\n2022"])
    })
    it("should handle center", () => {
      const formatter = new dttf.DatetimeTickFormatter({context: "%Y", context_which: "center"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["06/23\n", "01h\n2022", "02h\n"])
    })
    it("should handle all", () => {
      const formatter = new dttf.DatetimeTickFormatter({context: "%Y", context_which: "all"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["06/23\n2022", "01h\n2022", "02h\n2022"])
    })
  })
  describe("context_location", () => {
    it("should handle left", () => {
      const formatter = new dttf.DatetimeTickFormatter({context: "%Y", context_location: "left"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["2022 06/23", "01h", "02h"])
    })
    it("should handle right", () => {
      const formatter = new dttf.DatetimeTickFormatter({context: "%Y", context_location: "right"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["06/23 2022", "01h", "02h"])
    })
    it("should handle above", () => {
      const formatter = new dttf.DatetimeTickFormatter({context: "%Y", context_location: "above"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["2022\n06/23", "\n01h", "\n02h"])
    })
    it("should handle below", () => {
      const formatter = new dttf.DatetimeTickFormatter({context: "%Y", context_location: "below"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["06/23\n2022", "01h\n", "02h\n"])
    })
  })
})
