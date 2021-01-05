import {expect} from "assertions"

import {Slider, RangeSlider, DateSlider, DateRangeSlider} from "@bokehjs/models/widgets"
import {FuncTickFormatter} from "@bokehjs/models/formatters"
import {isInteger} from "@bokehjs/core/util/types"
import {build_view} from "@bokehjs/core/build_views"

describe("SliderView", () => {

  it("_calc_from should return integer if start/end/step all integers", async () => {
    const s = new Slider({start: 0, end: 10, step: 1})
    const sv = await build_view(s)

    const r = (sv as any /* XXX: protected */)._calc_from([5.0])
    expect(r).to.be.equal(5)
    expect(isInteger(r)).to.be.true
  })
})

describe("Slider", () => {
  it("should support string format", async () => {
    const slider = new Slider({format: "0a"})
    const slider_view = await build_view(slider)
    expect(slider_view.pretty(-104000)).to.be.equal("-104k")
  })

  it("should support TickFormatter format", async () => {
    const format = new FuncTickFormatter({code: "return (tick/1000).toFixed(0) + 'k'"})
    const slider = new Slider({format})
    const slider_view = await build_view(slider)
    expect(slider_view.pretty(-104000)).to.be.equal("-104k")
  })
})

describe("RangeSlider", () => {
  it("should support string format", async () => {
    const slider = new RangeSlider({format: "0a"})
    const slider_view = await build_view(slider)
    expect(slider_view.pretty(-104000)).to.be.equal("-104k")
  })

  it("should support TickFormatter format", async () => {
    const format = new FuncTickFormatter({code: "return (tick/1000).toFixed(0) + 'k'"})
    const slider = new RangeSlider({format})
    const slider_view = await build_view(slider)
    expect(slider_view.pretty(-104000)).to.be.equal("-104k")
  })
})

describe("DateSlider", () => {
  it("should support string format", async () => {
    const slider = new DateSlider({format: "%Y"})
    const slider_view = await build_view(slider)
    expect(slider_view.pretty(1599402993268)).to.be.equal("2020")
  })

  it("should support TickFormatter format", async () => {
    const format = new FuncTickFormatter({code: "return Math.floor(1970 + tick/(1000*60*60*24*365)).toFixed(0)"})
    const slider = new DateSlider({format})
    const slider_view = await build_view(slider)
    expect(slider_view.pretty(1599402993268)).to.be.equal("2020")
  })
})

describe("DateRangeSlider", () => {
  it("should support string format", async () => {
    const slider = new DateRangeSlider({format: "%Y"})
    const slider_view = await build_view(slider)
    expect(slider_view.pretty(1599402993268)).to.be.equal("2020")
  })

  it("should support TickFormatter format", async () => {
    const format = new FuncTickFormatter({code: "return Math.floor(1970 + tick/(1000*60*60*24*365)).toFixed(0)"})
    const slider = new DateRangeSlider({format})
    const slider_view = await build_view(slider)
    expect(slider_view.pretty(1599402993268)).to.be.equal("2020")
  })
})
