import {expect} from "assertions"

import {Slider, RangeSlider, DateSlider, DateRangeSlider, DatetimeRangeSlider} from "@bokehjs/models/widgets"
import {CustomJSTickFormatter} from "@bokehjs/models/formatters"
import {isInteger} from "@bokehjs/core/util/types"
import {build_view} from "@bokehjs/core/build_views"

describe("SliderView", () => {

  it("_calc_from should return integer if start/end/step all integers", async () => {
    const s = new Slider({start: 0, end: 10, step: 1, value: 0})
    const sv = (await build_view(s)).build()

    const r = (sv as any /* XXX: protected */)._calc_from([5.0])
    expect(r).to.be.equal(5)
    expect(isInteger(r)).to.be.true
  })
})

describe("Slider", () => {
  it("should support string format", () => {
    const slider = new Slider({format: "0a"})
    expect(slider.pretty(-104000)).to.be.equal("-104k")
  })

  it("should support TickFormatter format", () => {
    const format = new CustomJSTickFormatter({code: "return (tick/1000).toFixed(0) + 'k'"})
    const slider = new Slider({format})
    expect(slider.pretty(-104000)).to.be.equal("-104k")
  })
})

describe("RangeSlider", () => {
  it("should support string format", () => {
    const slider = new RangeSlider({format: "0a"})
    expect(slider.pretty(-104000)).to.be.equal("-104k")
  })

  it("should support TickFormatter format", () => {
    const format = new CustomJSTickFormatter({code: "return (tick/1000).toFixed(0) + 'k'"})
    const slider = new RangeSlider({format})
    expect(slider.pretty(-104000)).to.be.equal("-104k")
  })
})

describe("DateSlider", () => {
  it("should support string format", () => {
    const slider = new DateSlider({format: "%Y"})
    expect(slider.pretty(1599402993268)).to.be.equal("2020")
  })

  it("should support TickFormatter format", () => {
    const format = new CustomJSTickFormatter({code: "return Math.floor(1970 + tick/(1000*60*60*24*365)).toFixed(0)"})
    const slider = new DateSlider({format})
    expect(slider.pretty(1599402993268)).to.be.equal("2020")
  })
})

describe("DateRangeSlider", () => {
  it("should support string format", () => {
    const slider = new DateRangeSlider({format: "%Y"})
    expect(slider.pretty(1599402993268)).to.be.equal("2020")
  })

  it("should support TickFormatter format", () => {
    const format = new CustomJSTickFormatter({code: "return Math.floor(1970 + tick/(1000*60*60*24*365)).toFixed(0)"})
    const slider = new DateRangeSlider({format})
    expect(slider.pretty(1599402993268)).to.be.equal("2020")
  })
})

describe("DatetimeRangeSlider", () => {
  it("should support string format", () => {
    const slider = new DatetimeRangeSlider({format: "%Y %B %d"})
    const datetime = 1648211696000  // 2022-03-25 12:34:56
    expect(slider.pretty(datetime)).to.be.equal("2022 March 25")
    slider.format = "%H:%M:%S"
    expect(slider.pretty(datetime)).to.be.equal("12:34:56")
  })

  it("should support TickFormatter format", () => {
    const format = new CustomJSTickFormatter({code: "return Math.floor(1970 + tick/(1000*60*60*24*365)).toFixed(0)"})
    const slider = new DatetimeRangeSlider({format})
    expect(slider.pretty(1648211696000)).to.be.equal("2022")
  })
})
