import {expect} from "assertions"
import {display} from "../../_util"

import {Slider, RangeSlider, DateSlider, DateRangeSlider, DatetimeRangeSlider} from "@bokehjs/models/widgets"
import {CustomJSTickFormatter} from "@bokehjs/models/formatters"
import {isInteger} from "@bokehjs/core/util/types"
import {build_view} from "@bokehjs/core/build_views"

describe("SliderView", () => {

  it("_calc_from should return integer if start/end/step all integers", async () => {
    const s = new Slider({start: 0, end: 10, step: 1, value: 0})
    const {view: sv} = await display(s, null)

    /* @ts-ignore */
    const r = sv._calc_from([5.0])
    expect(r).to.be.equal(5)
    expect(isInteger(r)).to.be.true
  })
})

describe("Slider", () => {
  it("should support string format", async () => {
    const slider = new Slider({format: "0a"})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(-104000)).to.be.equal("-104k")
  })

  it("should support TickFormatter format", async () => {
    const format = new CustomJSTickFormatter({code: "return (tick/1000).toFixed(0) + 'k'"})
    const slider = new Slider({format})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(-104000)).to.be.equal("-104k")
  })
})

describe("RangeSlider", () => {
  it("should support string format", async () => {
    const slider = new RangeSlider({format: "0a"})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(-104000)).to.be.equal("-104k")
  })

  it("should support TickFormatter format", async () => {
    const format = new CustomJSTickFormatter({code: "return (tick/1000).toFixed(0) + 'k'"})
    const slider = new RangeSlider({format})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(-104000)).to.be.equal("-104k")
  })
})

describe("DateSliderView", () => {
  it("should convert steps from 1 day in the model to 86_400_000 milliseconds in the slider element", async () => {
    const start = 1451606400000 // 01 Jan 2016
    const end = 1451952000000 // 05 Jan 2016
    const value = 1451779200000 // 03 Jan 2016
    const slider = new DateSlider({start, end, value, step: 1})
    const {view} = await display(slider, null)

    const [next_step] = view._steps()
    expect(next_step).to.be.equal([86_400_000, 86_400_000])
  })
})

describe("DateSlider", () => {
  it("should support string format", async () => {
    const slider = new DateSlider({format: "%Y"})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(1599402993268)).to.be.equal("2020")
  })

  it("should support TickFormatter format", async () => {
    const format = new CustomJSTickFormatter({code: "return Math.floor(1970 + tick/(1000*60*60*24*365)).toFixed(0)"})
    const slider = new DateSlider({format})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(1599402993268)).to.be.equal("2020")
  })
})

describe("DateRangeSliderView", () => {
  it("should convert steps from 1 day in the model to 86_400_000 milliseconds in the slider element", async () => {
    const start = 1451606400000 // 01 Jan 2016
    const end = 1451952000000 // 05 Jan 2016
    const slider = new DateRangeSlider({start, end, value: [start, end], step: 1})
    const {view} = await display(slider, null)

    const [next_left_step, next_right_step] = view._steps()

    expect(next_left_step).to.be.equal([null, 86_400_000])
    expect(next_right_step).to.be.equal([86_400_000, null])
  })
})

describe("DateRangeSlider", () => {
  it("should support string format", async () => {
    const slider = new DateRangeSlider({format: "%Y"})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(1599402993268)).to.be.equal("2020")
  })

  it("should support TickFormatter format", async () => {
    const format = new CustomJSTickFormatter({code: "return Math.floor(1970 + tick/(1000*60*60*24*365)).toFixed(0)"})
    const slider = new DateRangeSlider({format})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(1599402993268)).to.be.equal("2020")
  })
})

describe("DatetimeRangeSlider", () => {
  it("should support string format", async () => {
    const datetime = 1648211696000  // 2022-03-25 12:34:56

    const slider0 = new DatetimeRangeSlider({format: "%Y %B %d"})
    const view0 = await build_view(slider0, {parent: null})
    expect(view0.pretty(datetime)).to.be.equal("2022 March 25")

    const slider1 = new DatetimeRangeSlider({format: "%H:%M:%S"})
    const view1 = await build_view(slider1, {parent: null})
    expect(view1.pretty(datetime)).to.be.equal("12:34:56")
  })

  it("should support TickFormatter format", async () => {
    const format = new CustomJSTickFormatter({code: "return Math.floor(1970 + tick/(1000*60*60*24*365)).toFixed(0)"})
    const slider = new DatetimeRangeSlider({format})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(1648211696000)).to.be.equal("2022")
  })
})
