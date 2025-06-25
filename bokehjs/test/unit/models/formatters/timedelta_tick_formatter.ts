import {expect} from "assertions"

import * as tdtf from "@bokehjs/models/formatters/timedelta_tick_formatter"

describe("resolution_order", () => {
  it("should list timedelta resolutions in ascending order", () => {
    const expected: tdtf.TimedeltaResolutionType[] = [
      "nanoseconds", "microseconds", "milliseconds", "seconds", "minsec", "minutes", "hourmin", "hours", "days",
    ]
    expect(tdtf.resolution_order).to.be.equal(expected)
  })
})

describe("_get_resolution", () => {
  it("should handle nanoseconds timedelta", () => {
    const low = 0
    const high = 0.000001 / 1.11
    expect(tdtf._get_resolution(low, 1)).to.be.equal("nanoseconds")
    expect(tdtf._get_resolution(high, 1)).to.be.equal("nanoseconds")
  })
  it("should handle microseconds timedelta", () => {
    const low = 0.000001 / 1.09
    const high = 0.001 / 1.11
    expect(tdtf._get_resolution(low, 1)).to.be.equal("microseconds")
    expect(tdtf._get_resolution(high, 1)).to.be.equal("microseconds")
  })
  it("should handle milliseconds timedelta", () => {
    const low  = 0.001 / 1.09
    const high  = 1 / 1.11
    expect(tdtf._get_resolution(low, 1)).to.be.equal("milliseconds")
    expect(tdtf._get_resolution(high, 1)).to.be.equal("milliseconds")
  })
  it("should handle seconds timedelta", () => {
    const low = 1 / 1.09
    const high = 60 / 1.11
    expect(tdtf._get_resolution(low, 0)).to.be.equal("seconds")
    expect(tdtf._get_resolution(low, 59)).to.be.equal("seconds")
    expect(tdtf._get_resolution(high, 0)).to.be.equal("seconds")
    expect(tdtf._get_resolution(high, 59)).to.be.equal("seconds")
  })
  it("should handle minsec timedelta", () => {
    const low = 1 / 1.09
    const high = 60 / 1.11
    expect(tdtf._get_resolution(low, 60)).to.be.equal("minsec")
    expect(tdtf._get_resolution(high, 60)).to.be.equal("minsec")
  })
  it("should handle minutes timedelta", () => {
    const low = 60 / 1.09
    const high = 60 * 60 / 1.11
    expect(tdtf._get_resolution(low, 0)).to.be.equal("minutes")
    expect(tdtf._get_resolution(low, 3599)).to.be.equal("minutes")
    expect(tdtf._get_resolution(high, 0)).to.be.equal("minutes")
    expect(tdtf._get_resolution(high, 3599)).to.be.equal("minutes")
  })
  it("should handle hourmin timedelta", () => {
    const low = 60 / 1.09
    const high = 60 * 60 / 1.11
    expect(tdtf._get_resolution(low, 3600)).to.be.equal("hourmin")
    expect(tdtf._get_resolution(high, 3600)).to.be.equal("hourmin")
  })
  it("should handle hours timedelta", () => {
    const low = 60 * 60 / 1.09
    const high = 60 * 60 * 24 / 1.11
    expect(tdtf._get_resolution(low, 1)).to.be.equal("hours")
    expect(tdtf._get_resolution(high, 1)).to.be.equal("hours")
  })
  it("should handle days timedelta", () => {
    const low = 60 * 60 * 24 / 1.09
    expect(tdtf._get_resolution(low, 1)).to.be.equal("days")
  })
})

describe("_str_timedelta", () => {
  it("should handle no format", () => {
    const t = 1655945719752
    expect(tdtf._str_timedelta(t, "foo")).to.be.equal("foo")
  })
  it("should handle microseconds", () => {
    const t = 123456789.1234
    expect(tdtf._str_timedelta(t, "%US")).to.be.equal("123")
  })
  it("should handle nanoseconds", () => {
    const t1 = 1655945719752.0
    expect(tdtf._str_timedelta(t1, "%NS")).to.be.equal("000")

    const t2 = 1652.000001
    expect(tdtf._str_timedelta(t2, "%NS")).to.be.equal("001")

    const t3 = 1652.0
    expect(tdtf._str_timedelta(t3, "%NS")).to.be.equal("000")

    const t4 = 1652.000991
    expect(tdtf._str_timedelta(t4, "%NS")).to.be.equal("991")

    const t5 = 1652.000999
    expect(tdtf._str_timedelta(t5, "%NS")).to.be.equal("999")
  })
  it("should handle total nanoseconds", () => {
    const t1 = 1655945719752.0
    expect(tdtf._str_timedelta(t1, "%ns")).to.be.equal("1655945719752000000")

    const t2 = 1652.000001
    expect(tdtf._str_timedelta(t2, "%ns")).to.be.equal("1652000001")

    const t3 = 1652.0
    expect(tdtf._str_timedelta(t3, "%ns")).to.be.equal("1652000000")

    const t4 = 1652.000991
    expect(tdtf._str_timedelta(t4, "%ns")).to.be.equal("1652000991")

    const t5 = 1652.000999
    expect(tdtf._str_timedelta(t5, "%ns")).to.be.equal("1652000999")
  })
})

const t = 1655945719752
const MIN = 60 * 1000
const HOUR = 3600 * 1000
const DAY = 3600 * 24 * 1000

describe("TimedeltaTickFormatter", () => {
  describe("doFormat method", () => {
    it("should handle empty list", () => {
      const formatter = new tdtf.TimedeltaTickFormatter()
      const labels = formatter.doFormat([], {loc: 0})
      expect(labels).to.be.equal([])
    })
    it("should handle nanoseconds", () => {
      const formatter = new tdtf.TimedeltaTickFormatter()
      const labels = formatter.doFormat([t/1000000, t/1000000+0.000001, t/1000000+0.000002], {loc: 0})
      expect(labels).to.be.equal(["752ns", "753ns", "754ns"])
    })
    it("should handle microseconds", () => {
      const formatter = new tdtf.TimedeltaTickFormatter()
      const labels = formatter.doFormat([t, t+0.001, t+0.002], {loc: 0})
      expect(labels).to.be.equal(["000us", "001us", "002us"])
    })
    it("should handle milliseconds", () => {
      const formatter = new tdtf.TimedeltaTickFormatter()
      const labels = formatter.doFormat([t, t+1, t+2], {loc: 0})
      expect(labels).to.be.equal(["752ms", "753ms", "754ms"])
    })
    it("should handle seconds", () => {
      const formatter = new tdtf.TimedeltaTickFormatter()
      const labels = formatter.doFormat([t, t+1000, t+2000], {loc: 0})
      expect(labels).to.be.equal(["00:55:19", "00:55:20", "00:55:21"])
    })
    it("should handle minsec", () => {
      const formatter = new tdtf.TimedeltaTickFormatter()
      const labels = formatter.doFormat([t, t+50000, t+100000], {loc: 0})
      expect(labels).to.be.equal(["00:55:19", "00:56:09", "00:56:59"])
    })
    it("should handle minutes", () => {
      const formatter = new tdtf.TimedeltaTickFormatter()
      const labels = formatter.doFormat([t, t+MIN, t+MIN*2], {loc: 0})
      expect(labels).to.be.equal(["00:55", "00:56", "00:57"])
    })
    it("should handle hourmin", () => {
      const formatter = new tdtf.TimedeltaTickFormatter()
      const labels = formatter.doFormat([t, t+MIN*30, t+MIN*60], {loc: 0})
      expect(labels).to.be.equal(["00:55", "01:25", "01:55"])
    })
    it("should handle hours", () => {
      const formatter = new tdtf.TimedeltaTickFormatter()
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      // happens to test near day boundary
      expect(labels).to.be.equal(["00:55", "01:55", "02:55"])
    })
    it("should handle days", () => {
      const formatter = new tdtf.TimedeltaTickFormatter()
      const labels = formatter.doFormat([t, t+DAY, t+DAY*2], {loc: 0})
      expect(labels).to.be.equal(["19166 days", "19167 days", "19168 days"])
    })
  })

  describe("strip_leading_zeros", () => {
    it("should handle boolean", () => {
      const formatter = new tdtf.TimedeltaTickFormatter({strip_leading_zeros: true})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["0:55", "1:55", "2:55"])
    })
    it("should handle resolution type hours", () => {
      const formatter = new tdtf.TimedeltaTickFormatter({strip_leading_zeros: ["hours"]})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["0:55", "1:55", "2:55"])
    })
    it("should handle resolution type days", () => {
      const formatter = new tdtf.TimedeltaTickFormatter({strip_leading_zeros: ["days"]})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["00:55", "01:55", "02:55"])
    })
    it("should handle resolution type milliseconds", () => {
      const formatter = new tdtf.TimedeltaTickFormatter({strip_leading_zeros: ["milliseconds"]})
      const labels = formatter.doFormat([t-752, t-747, t-742], {loc: 0})
      expect(labels).to.be.equal(["0ms", "5ms", "10ms"])
    })
  })
  describe("hide_repeats", () => {
    it("should handle boolean", () => {
      const formatter = new tdtf.TimedeltaTickFormatter({hours: "%d", hide_repeats: true})
      const labels = formatter.doFormat([t+HOUR, t+HOUR*2, t+HOUR*3], {loc: 0})
      expect(labels).to.be.equal(["19166", "", ""])
    })
    it("should handle boolean within context", () => {
      const context = new tdtf.TimedeltaTickFormatter({
        nanoseconds: "nanoseconds",
        microseconds: "microseconds",
        milliseconds: "milliseconds",
        seconds: "s",
        minsec: "minsec",
        minutes: "minutes",
        hourmin: "hourmin",
        hours: "hours",
        days: "days",
        hide_repeats: true})
      const formatter = new tdtf.TimedeltaTickFormatter({context, context_which: "all"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["00:55\nhours", "01:55\n", "02:55\n"])
    })
  })
  describe("context", () => {
    it("should handle plain string", () => {
      const formatter = new tdtf.TimedeltaTickFormatter({context: "FOO"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["00:55\nFOO", "01:55\n", "02:55\n"])
    })
    it("should handle a format string", () => {
      const formatter = new tdtf.TimedeltaTickFormatter({context: "%S"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["00:55\n19", "01:55\n", "02:55\n"])
    })
    it("should handle a TimedeltaTickFormatter", () => {
      const context = new tdtf.TimedeltaTickFormatter({
        microseconds: "microseconds",
        milliseconds: "milliseconds",
        seconds: "s",
        minsec: "minsec",
        minutes: "minutes",
        hourmin: "hourmin",
        hours: "hours",
        days: "days"})
      const formatter = new tdtf.TimedeltaTickFormatter({context})

      // A tick formatter used for context will format according to the "parent" resolution
      const us_labels = formatter.doFormat([t, t+0.001, t+0.002], {loc: 0})
      expect(us_labels).to.be.equal(["000us\nmicroseconds", "001us\n", "002us\n"])

      const days_labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(days_labels).to.be.equal(["00:55\nhours", "01:55\n", "02:55\n"])

      const years_labels = formatter.doFormat([t, t+DAY, t+DAY*2], {loc: 0})
      expect(years_labels).to.be.equal(["19166 days\ndays", "19167 days\n", "19168 days\n"])
    })
  })
  describe("context_which", () => {
    it("should handle start", () => {
      const formatter = new tdtf.TimedeltaTickFormatter({context: "%S", context_which: "start"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["00:55\n19", "01:55\n", "02:55\n"])
    })
    it("should handle end", () => {
      const formatter = new tdtf.TimedeltaTickFormatter({context: "%S", context_which: "end"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["00:55\n", "01:55\n", "02:55\n19"])
    })
    it("should handle center", () => {
      const formatter = new tdtf.TimedeltaTickFormatter({context: "%S", context_which: "center"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["00:55\n", "01:55\n19", "02:55\n"])
    })
    it("should handle all", () => {
      const formatter = new tdtf.TimedeltaTickFormatter({context: "%S", context_which: "all"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["00:55\n19", "01:55\n19", "02:55\n19"])
    })
  })
  describe("context_location", () => {
    it("should handle left", () => {
      const formatter = new tdtf.TimedeltaTickFormatter({context: "%S", context_location: "left"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["19 00:55", "01:55", "02:55"])
    })
    it("should handle right", () => {
      const formatter = new tdtf.TimedeltaTickFormatter({context: "%S", context_location: "right"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["00:55 19", "01:55", "02:55"])
    })
    it("should handle above", () => {
      const formatter = new tdtf.TimedeltaTickFormatter({context: "%S", context_location: "above"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["19\n00:55", "\n01:55", "\n02:55"])
    })
    it("should handle below", () => {
      const formatter = new tdtf.TimedeltaTickFormatter({context: "%S", context_location: "below"})
      const labels = formatter.doFormat([t, t+HOUR, t+HOUR*2], {loc: 0})
      expect(labels).to.be.equal(["00:55\n19", "01:55\n", "02:55\n"])
    })
  })
})
