import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"

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

  describe("bounds", () => {
    // Python always sends `value_throttled` equal to `value`, so do the same here
    const make = (attrs: {start?: number, end?: number, value?: number}) => {
      return new Slider({step: 1, ...attrs, ...(attrs.value != null ? {value_throttled: attrs.value} : {})})
    }

    function count_changes(slider: Slider): () => number {
      let n = 0
      slider.connect(slider.properties.value.change, () => n++)
      slider.connect(slider.properties.value_throttled.change, () => n++)
      return () => n
    }

    describe("at creation", () => {
      const cases: {start: number, end: number, value: number, expected: number}[] = [
        {start: 5, end: 10, value: 0,  expected: 5},  // below start
        {start: 5, end: 10, value: 12, expected: 10}, // above end
        {start: 5, end: 10, value: 7,  expected: 7},  // inside
        {start: 5, end: 10, value: 5,  expected: 5},  // on start
        {start: 5, end: 10, value: 10, expected: 10}, // on end
      ]
      for (const {start, end, value, expected} of cases) {
        it(`should turn value=${value} into ${expected} for [${start}, ${end}]`, () => {
          const slider = make({start, end, value})
          expect(slider.value).to.be.equal(expected)
          expect(slider.value_throttled).to.be.equal(expected)
        })
      }

      it("should support initialization without a value", () => {
        expect(() => make({start: 0, end: 10})).to.not.throw()
      })

      it("should support initialization with only one bound", () => {
        expect(make({end: 10, value: 12}).value).to.be.equal(10)
        expect(make({start: 5, value: 0}).value).to.be.equal(5)
        expect(make({end: 10, value: -100}).value).to.be.equal(-100)
        expect(make({start: 5, value: 100}).value).to.be.equal(100)
      })
    })

    describe("when start or end change", () => {
      it("should clamp value and value_throttled when start moves past them", () => {
        const slider = make({start: 0, end: 10, value: 4})
        slider.start = 5
        expect(slider.value).to.be.equal(5)
        expect(slider.value_throttled).to.be.equal(5)
      })

      it("should clamp value and value_throttled when end moves past them", () => {
        const slider = make({start: 0, end: 10, value: 8})
        slider.end = 7
        expect(slider.value).to.be.equal(7)
        expect(slider.value_throttled).to.be.equal(7)
      })

      it("should clamp value_throttled when only it is out of bounds", () => {
        const slider = make({start: 0, end: 10, value: 6})
        slider.setv({value_throttled: 9})
        slider.end = 7
        expect(slider.value).to.be.equal(6)
        expect(slider.value_throttled).to.be.equal(7)

        slider.setv({value_throttled: 1})
        slider.start = 3
        expect(slider.value).to.be.equal(6)
        expect(slider.value_throttled).to.be.equal(3)
      })

      it("should clamp value when only it is out of bounds, leaving value_throttled alone", () => {
        const slider = make({start: 0, end: 10, value: 9})
        slider.setv({value_throttled: 6})
        slider.end = 7
        expect(slider.value).to.be.equal(7)
        expect(slider.value_throttled).to.be.equal(6)
      })

      it("should not touch value when the range is widened or still contains it", () => {
        const slider = make({start: 2, end: 8, value: 5})
        const changes = count_changes(slider)
        slider.start = 0
        slider.end = 10
        slider.start = 5 // value sits exactly on the new bound
        slider.end = 5
        expect(slider.value).to.be.equal(5)
        expect(slider.value_throttled).to.be.equal(5)
        expect(changes()).to.be.equal(0)
      })

      it("should handle start and end changed in a single update", () => {
        const slider = make({start: 0, end: 10, value: 2})
        slider.setv({start: 6, end: 8})
        expect(slider.value).to.be.equal(6)
        expect(slider.value_throttled).to.be.equal(6)

        slider.setv({start: 0, end: 4})
        expect(slider.value).to.be.equal(4)
        expect(slider.value_throttled).to.be.equal(4)
      })

      it("should enforce bounds once value is set after partial initialization", () => {
        const slider = make({start: 0, end: 10})
        slider.value = 4
        slider.start = 5
        expect(slider.value).to.be.equal(5)
      })
    })

    describe("observers", () => {
      it("should see the new bound when notified of a value change", () => {
        const slider = make({start: 0, end: 10, value: 8})
        const seen: {start: number, end: number, value: number}[] = []
        slider.connect(slider.properties.value.change, () => {
          seen.push({start: slider.start, end: slider.end, value: slider.value})
        })
        slider.end = 7
        expect(seen).to.be.equal([{start: 0, end: 7, value: 7}])
      })

      it("should see the new bound when notified of a value_throttled change", () => {
        const slider = make({start: 0, end: 10, value: 8})
        const seen: {end: number, value_throttled: number}[] = []
        slider.connect(slider.properties.value_throttled.change, () => {
          seen.push({end: slider.end, value_throttled: slider.value_throttled})
        })
        slider.end = 7
        expect(seen).to.be.equal([{end: 7, value_throttled: 7}])
      })

      it("should see an already clamped value when notified of a bound change", async () => {
        const slider = make({start: 0, end: 10, value: 8})
        const {view} = await display(slider, [500, 100])

        // connected after the view exists, so it runs after anything the model
        // or the view connected to the same signal
        const seen: number[] = []
        slider.connect(slider.properties.end.change, () => seen.push(slider.value))
        slider.end = 7
        await view.ready

        expect(seen).to.be.equal([7])
      })

      it("should render the clamped value", async () => {
        const slider = make({start: 0, end: 10, value: 8})
        slider.title = "Value"
        const {view} = await display(slider, [500, 100])

        slider.end = 7
        await view.ready

        /* @ts-ignore */
        expect(view.title_el.textContent).to.be.equal("Value: 7")
      })
    })
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

  describe("bounds", () => {
    type Range = [number, number]

    // Python always sends `value_throttled` equal to `value`, so do the same here
    const make = (attrs: {start?: number, end?: number, value?: Range}) => {
      const {value} = attrs
      return new RangeSlider({step: 1, ...attrs, ...(value != null ? {value_throttled: [...value] as Range} : {})})
    }

    function count_changes(slider: RangeSlider): () => number {
      let n = 0
      slider.connect(slider.properties.value.change, () => n++)
      slider.connect(slider.properties.value_throttled.change, () => n++)
      return () => n
    }

    describe("at creation", () => {
      const cases: {start: number, end: number, value: Range, expected: Range}[] = [
        {start: 5, end: 10, value: [0, 3],   expected: [5, 5]},   // entirely below
        {start: 5, end: 10, value: [11, 12], expected: [10, 10]}, // entirely above
        {start: 5, end: 10, value: [0, 7],   expected: [5, 7]},   // low handle out
        {start: 5, end: 10, value: [8, 12],  expected: [8, 10]},  // high handle out
        {start: 5, end: 10, value: [0, 12],  expected: [5, 10]},  // both out
        {start: 5, end: 10, value: [6, 9],   expected: [6, 9]},   // inside
        {start: 5, end: 10, value: [5, 10],  expected: [5, 10]},  // on both bounds
      ]
      for (const {start, end, value, expected} of cases) {
        it(`should turn value=[${value}] into [${expected}] for [${start}, ${end}]`, () => {
          const slider = make({start, end, value})
          expect(slider.value).to.be.equal(expected)
          expect(slider.value_throttled).to.be.equal(expected)
        })
      }

      it("should support initialization without a value", () => {
        expect(() => make({start: 0, end: 10})).to.not.throw()
      })

      it("should support initialization with only one bound", () => {
        expect(make({end: 10, value: [-100, 12]}).value).to.be.equal([-100, 10])
        expect(make({start: 5, value: [0, 100]}).value).to.be.equal([5, 100])
      })
    })

    describe("when start or end change", () => {
      it("should keep value inside range bounds", () => {
        const slider = make({start: 0, end: 10, value: [4, 8]})
        slider.start = 5
        slider.end = 7
        expect(slider.value).to.be.equal([5, 7])
      })

      it("should keep value_throttled inside range bounds", () => {
        const slider = make({start: 0, end: 10, value: [4, 8]})
        slider.start = 5
        slider.end = 7
        expect(slider.value_throttled).to.be.equal([5, 7])
      })

      it("should only move the handle that is out of bounds", () => {
        const slider = make({start: 0, end: 10, value: [4, 6]})
        slider.start = 5
        expect(slider.value).to.be.equal([5, 6])
        slider.end = 5.5
        expect(slider.value).to.be.equal([5, 5.5])
      })

      it("should collapse value to the bound when the range moves past it entirely", () => {
        const slider = make({start: 0, end: 10, value: [2, 3]})
        slider.start = 5
        expect(slider.value).to.be.equal([5, 5])
        slider.end = 4.5
        expect(slider.value).to.be.equal([4.5, 4.5])
      })

      it("should clamp value_throttled when only it is out of bounds", () => {
        const slider = make({start: 0, end: 10, value: [4, 6]})
        slider.setv({value_throttled: [2, 8]})
        slider.end = 7
        expect(slider.value).to.be.equal([4, 6])
        expect(slider.value_throttled).to.be.equal([2, 7])

        slider.start = 3
        expect(slider.value).to.be.equal([4, 6])
        expect(slider.value_throttled).to.be.equal([3, 7])
      })

      it("should clamp value when only it is out of bounds, leaving value_throttled alone", () => {
        const slider = make({start: 0, end: 10, value: [4, 9]})
        slider.setv({value_throttled: [4, 6]})
        slider.end = 7
        expect(slider.value).to.be.equal([4, 7])
        expect(slider.value_throttled).to.be.equal([4, 6])
      })

      it("should not touch value when the range is widened or still contains it", () => {
        const slider = make({start: 2, end: 8, value: [4, 6]})
        const changes = count_changes(slider)
        slider.start = 0
        slider.end = 10
        slider.start = 4 // handles sit exactly on the new bounds
        slider.end = 6
        expect(slider.value).to.be.equal([4, 6])
        expect(slider.value_throttled).to.be.equal([4, 6])
        expect(changes()).to.be.equal(0)
      })

      it("should handle start and end changed in a single update", () => {
        const slider = make({start: 0, end: 10, value: [1, 9]})
        slider.setv({start: 3, end: 7})
        expect(slider.value).to.be.equal([3, 7])
        expect(slider.value_throttled).to.be.equal([3, 7])
      })

      it("should not alias value and value_throttled", () => {
        // without `value_throttled`, as when created from JavaScript only
        const slider = new RangeSlider({start: 0, end: 10, step: 1, value: [4, 8]})
        slider.end = 7
        expect(slider.value).to.be.equal([4, 7])
        expect(slider.value_throttled).to.be.equal([4, 7])
        expect(slider.value).to.not.be.identical(slider.value_throttled)
      })

      it("should enforce bounds once value is set after partial initialization", () => {
        const slider = make({start: 0, end: 10})
        slider.value = [2, 8]
        slider.end = 7
        expect(slider.value).to.be.equal([2, 7])
      })
    })

    describe("observers", () => {
      it("should see the new bound when notified of a value change", () => {
        const slider = make({start: 0, end: 10, value: [4, 8]})
        const seen: {start: number, end: number, value: Range}[] = []
        slider.connect(slider.properties.value.change, () => {
          seen.push({start: slider.start, end: slider.end, value: slider.value})
        })
        slider.end = 7
        expect(seen).to.be.equal([{start: 0, end: 7, value: [4, 7]}])
      })

      it("should see the new bound when notified of a value_throttled change", () => {
        const slider = make({start: 0, end: 10, value: [4, 8]})
        const seen: {end: number, value_throttled: Range}[] = []
        slider.connect(slider.properties.value_throttled.change, () => {
          seen.push({end: slider.end, value_throttled: slider.value_throttled})
        })
        slider.end = 7
        expect(seen).to.be.equal([{end: 7, value_throttled: [4, 7]}])
      })

      it("should see an already clamped value when notified of a bound change", async () => {
        const slider = make({start: 0, end: 10, value: [4, 8]})
        const {view} = await display(slider, [500, 100])

        // connected after the view exists, so it runs after anything the model
        // or the view connected to the same signal
        const seen: Range[] = []
        slider.connect(slider.properties.end.change, () => seen.push(slider.value))
        slider.end = 7
        await view.ready

        expect(seen).to.be.equal([[4, 7]])
      })
    })
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
