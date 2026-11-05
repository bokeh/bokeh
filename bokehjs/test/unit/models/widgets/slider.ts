import {expect, expect_not_null} from "#framework/assertions"
import * as sinon from "sinon"
import {display} from "#framework/layouts"

import {
  CategoricalSlider,
  DateRangeSlider,
  DateSlider,
  DatetimeRangeSlider,
  MultiValuedSlider,
  RangeSlider,
  Slider,
} from "@bokehjs/models/widgets"
import {CustomJSTickFormatter} from "@bokehjs/models/formatters"
import {isInteger} from "@bokehjs/core/util/types"
import {build_view} from "@bokehjs/core/build_views"
import * as slider_css from "@bokehjs/styles/widgets/sliders.css"
import type {AbstractSliderView} from "@bokehjs/models/widgets/sliders/abstract_slider"

const {abs, round} = Math

type Elements = {track: HTMLElement, span: HTMLElement | null, handles: HTMLElement[]}

function elements(view: AbstractSliderView<unknown>): Elements {
  const track = view.shadow_el.querySelector<HTMLElement>(`.${slider_css.track}`)
  expect_not_null(track)
  const span = view.shadow_el.querySelector<HTMLElement>(`.${slider_css.span}`)
  const handles = [...view.shadow_el.querySelectorAll<HTMLElement>(`.${slider_css.handle}`)]
  return {track, span, handles}
}

/** Client coordinates of a fraction `at` of the track's (horizontal) extent. */
function on_track(track: HTMLElement, at: number): {clientX: number, clientY: number} {
  const {left, top, height} = track.getBoundingClientRect()
  const x = left + track.clientLeft + at*track.clientWidth
  return {clientX: x, clientY: top + height/2}
}

/** Client coordinates of a fraction `at` of the track's vertical extent (from the top). */
function on_vtrack(track: HTMLElement, at: number): {clientX: number, clientY: number} {
  const {left, top, width} = track.getBoundingClientRect()
  const y = top + track.clientTop + at*track.clientHeight
  return {clientX: left + width/2, clientY: y}
}

function center(el: HTMLElement): {clientX: number, clientY: number} {
  const {left, top, width, height} = el.getBoundingClientRect()
  return {clientX: left + width/2, clientY: top + height/2}
}

const pointer = {bubbles: true, composed: true, isPrimary: true, pointerType: "mouse", pointerId: 1, button: 0}

type At = typeof on_track

async function drag(view: AbstractSliderView<unknown>, el: HTMLElement, from: {clientX: number, clientY: number}, to_at: number, at: At = on_track): Promise<void> {
  const {track} = elements(view)
  el.dispatchEvent(new PointerEvent("pointerdown", {...pointer, ...from}))
  el.dispatchEvent(new PointerEvent("pointermove", {...pointer, ...at(track, to_at)}))
  el.dispatchEvent(new PointerEvent("pointerup", {...pointer, ...at(track, to_at)}))
  await view.ready
}

describe("SliderView", () => {

  it("_calc_from should return integer if start/end/step all integers", async () => {
    const s = Slider.create({start: 0, end: 10, step: 1, value: 0})
    const {view: sv} = await display(s, null)

    const r = sv.meta.compute(5.0)
    expect(r).to.be.equal(5)
    expect(isInteger(r)).to.be.true
  })
})

describe("Slider", () => {
  it("should support string format", async () => {
    const slider = Slider.create({format: "0a"})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(-104000)).to.be.equal("-104k")
  })

  it("should support TickFormatter format", async () => {
    const format = CustomJSTickFormatter.create({code: "return (tick/1000).toFixed(0) + 'k'"})
    const slider = Slider.create({format})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(-104000)).to.be.equal("-104k")
  })

  describe("bounds", () => {
    // Python always sends `value_throttled` equal to `value`, so do the same here
    const make = (attrs: {start?: number, end?: number, value?: number}) => {
      return Slider.create({step: 1, ...attrs, ...(attrs.value != null ? {value_throttled: attrs.value} : {})})
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

        const title_el = view.shadow_el.querySelector(`.${slider_css.title}`)
        expect_not_null(title_el)
        expect(title_el.textContent).to.be.equal("Value: 7")
      })
    })
  })
})

describe("RangeSlider", () => {
  it("should support string format", async () => {
    const slider = RangeSlider.create({format: "0a"})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(-104000)).to.be.equal("-104k")
  })

  it("should support TickFormatter format", async () => {
    const format = CustomJSTickFormatter.create({code: "return (tick/1000).toFixed(0) + 'k'"})
    const slider = RangeSlider.create({format})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(-104000)).to.be.equal("-104k")
  })

  describe("bounds", () => {
    type Range = [number, number]

    // Python always sends `value_throttled` equal to `value`, so do the same here
    const make = (attrs: {start?: number, end?: number, value?: Range}) => {
      const {value} = attrs
      return RangeSlider.create({step: 1, ...attrs, ...(value != null ? {value_throttled: [...value] as Range} : {})})
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
        // moving end below start would make the slider reversed instead, so move both
        slider.setv({start: 1, end: 4.5})
        expect(slider.value).to.be.equal([4.5, 4.5])
        slider.setv({start: 6, end: 9})
        expect(slider.value).to.be.equal([6, 6])
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
        const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [4, 8]})
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

describe("MultiValuedSlider", () => {
  describe("bounds", () => {
    it("should clamp values of reversed sliders", () => {
      const slider = MultiValuedSlider.create({start: 10, end: 0, value: [-5, 5, 15]})
      expect(slider.value).to.be.equal([0, 5, 10])
      slider.start = 8
      expect(slider.value).to.be.equal([0, 5, 8])
    })

    it("should clamp values at creation", () => {
      const slider = MultiValuedSlider.create({start: 0, end: 10, value: [-5, 5, 15]})
      expect(slider.value).to.be.equal([0, 5, 10])
      expect(slider.value_throttled).to.be.equal([0, 5, 10])
      expect(slider.value).to.not.be.identical(slider.value_throttled)
    })

    it("should clamp values when start or end change", () => {
      const slider = MultiValuedSlider.create({start: 0, end: 10, value: [2, 5, 8]})
      slider.end = 6
      expect(slider.value).to.be.equal([2, 5, 6])
      slider.start = 3
      expect(slider.value).to.be.equal([3, 5, 6])
    })

    it("should not touch values when the range still contains them", () => {
      const slider = MultiValuedSlider.create({start: 0, end: 10, value: [2, 5, 8]})
      const {value} = slider
      slider.setv({start: -10, end: 20})
      expect(slider.value).to.be.identical(value)
    })

    it("should clamp value_throttled independently of value", () => {
      const slider = MultiValuedSlider.create({start: 0, end: 10, value: [2, 5, 8]})
      slider.setv({value_throttled: [1, 9, 9]})
      slider.end = 8
      expect(slider.value).to.be.equal([2, 5, 8])
      expect(slider.value_throttled).to.be.equal([1, 8, 8])
    })
  })

  it("should support string format", async () => {
    const slider = MultiValuedSlider.create({format: "0a"})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(-104000)).to.be.equal("-104k")
  })

  it("should support TickFormatter format", async () => {
    const format = CustomJSTickFormatter.create({code: "return (tick/1000).toFixed(0) + 'k'"})
    const slider = MultiValuedSlider.create({format})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(-104000)).to.be.equal("-104k")
  })

  it("should render a handle per value and no span", async () => {
    const slider = MultiValuedSlider.create({start: 0, end: 10, step: 1, value: [2, 5, 8]})
    const {view} = await display(slider, [300, 50])
    const {span, handles} = elements(view)
    expect(span).to.be.null
    expect(handles.length).to.be.equal(3)
    expect(handles.map((el) => el.ariaValueText)).to.be.equal(["2", "5", "8"])
  })

  describe("should capture the pointer", () => {
    let capture: sinon.SinonSpy<[number], void>

    before_each(() => {
      capture = sinon.spy(HTMLElement.prototype, "setPointerCapture")
    })

    after_each(() => {
      capture.restore()
    })

    it("on the handle when pressing the track", async () => {
      const slider = MultiValuedSlider.create({start: 0, end: 10, step: 1, value: [2, 5, 8]})
      const {view} = await display(slider, [300, 50])
      const {track, handles: [, , handle2]} = elements(view)

      track.dispatchEvent(new PointerEvent("pointerdown", {...pointer, ...on_track(track, 0.9)}))
      track.dispatchEvent(new PointerEvent("pointerup", {...pointer, ...on_track(track, 0.9)}))
      await view.ready
      expect(capture.thisValues).to.be.equal([handle2])
    })

    it("on the span when dragging it", async () => {
      const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [2, 5]})
      const {view} = await display(slider, [300, 50])
      const {track, span} = elements(view)
      expect_not_null(span)

      await drag(view, span, on_track(track, 0.35), 0.45)
      expect(capture.thisValues).to.be.equal([span])
    })

    it("and transfer it when separating overlapping handles", async () => {
      const slider = MultiValuedSlider.create({start: 0, end: 10, step: 1, value: [5, 5, 5]})
      const {view} = await display(slider, [300, 50])
      const {track, handles: [handle0, handle1]} = elements(view)

      handle1.dispatchEvent(new PointerEvent("pointerdown", {...pointer, ...center(handle1)}))
      handle1.dispatchEvent(new PointerEvent("pointermove", {...pointer, ...on_track(track, 0.3)}))
      await view.ready
      expect(capture.thisValues).to.be.equal([handle1, handle0])
      expect(slider.value).to.be.equal([3, 5, 5])

      // losing capture on the previous handle must not end the drag
      handle1.dispatchEvent(new PointerEvent("lostpointercapture", {...pointer}))
      handle0.dispatchEvent(new PointerEvent("pointermove", {...pointer, ...on_track(track, 0.2)}))
      await view.ready
      expect(slider.value).to.be.equal([2, 5, 5])

      // but losing it on the current one does
      handle0.dispatchEvent(new PointerEvent("lostpointercapture", {...pointer}))
      handle0.dispatchEvent(new PointerEvent("pointermove", {...pointer, ...on_track(track, 0.1)}))
      await view.ready
      expect(slider.value).to.be.equal([2, 5, 5])
      expect(slider.value_throttled).to.be.equal([2, 5, 5])
    })
  })

  it("should support dragging any handle and update value_throttled at the end", async () => {
    const slider = MultiValuedSlider.create({start: 0, end: 10, step: 1, value: [2, 5, 8]})
    const {view} = await display(slider, [300, 50])
    const {handles: [, handle1]} = elements(view)

    await drag(view, handle1, center(handle1), 0.6)
    expect(slider.value).to.be.equal([2, 6, 8])
    expect(slider.value_throttled).to.be.equal([2, 6, 8])
  })

  it("should move the nearest handle when pressing the track", async () => {
    const slider = MultiValuedSlider.create({start: 0, end: 10, step: 1, value: [2, 5, 8]})
    const {view} = await display(slider, [300, 50])
    const {track} = elements(view)

    await drag(view, track, on_track(track, 0.9), 0.9)
    expect(slider.value).to.be.equal([2, 5, 9])

    await drag(view, track, on_track(track, 0.4), 0.4)
    expect(slider.value).to.be.equal([2, 4, 9])
  })

  it("should not allow handles to cross", async () => {
    const slider = MultiValuedSlider.create({start: 0, end: 10, step: 1, value: [2, 5, 8]})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle0, handle1]} = elements(view)

    await drag(view, handle1, center(handle1), 1.0)
    expect(slider.value).to.be.equal([2, 8, 8])

    await drag(view, handle0, center(handle0), 1.0)
    expect(slider.value).to.be.equal([8, 8, 8])
  })

  it("should allow separating overlapping handles", async () => {
    const slider = MultiValuedSlider.create({start: 0, end: 10, step: 1, value: [5, 5, 5]})
    const {view} = await display(slider, [300, 50])
    const {handles: [, handle1]} = elements(view)

    await drag(view, handle1, center(handle1), 0.2)
    expect(slider.value).to.be.equal([2, 5, 5])

    const {handles: [, , handle2]} = elements(view)
    await drag(view, handle2, center(handle2), 0.7)
    expect(slider.value).to.be.equal([2, 5, 7])
  })

  it("should support keyboard and respect handle ordering", async () => {
    const slider = MultiValuedSlider.create({start: 0, end: 10, step: 1, value: [2, 5, 8]})
    const {view} = await display(slider, [300, 50])
    const {handles: [, handle1]} = elements(view)

    handle1.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight"}))
    await view.ready
    expect(slider.value).to.be.equal([2, 6, 8])

    handle1.dispatchEvent(new KeyboardEvent("keydown", {key: "End"}))
    await view.ready
    expect(slider.value).to.be.equal([2, 8, 8])

    handle1.dispatchEvent(new KeyboardEvent("keydown", {key: "Home"}))
    await view.ready
    expect(slider.value).to.be.equal([2, 2, 8])
  })

  it("should stop the focused handle at its neighbors when using keyboard", async () => {
    const slider = MultiValuedSlider.create({start: 0, end: 10, step: 1, value: [2, 5, 8]})
    const {view} = await display(slider, [300, 50])
    const {handles: [, handle1]} = elements(view)

    async function press(key: string, n: number): Promise<number[][]> {
      const values = []
      for (let i = 0; i < n; i++) {
        handle1.dispatchEvent(new KeyboardEvent("keydown", {key}))
        await view.ready
        values.push(slider.value)
      }
      return values
    }

    expect(await press("ArrowRight", 4)).to.be.equal([[2, 6, 8], [2, 7, 8], [2, 8, 8], [2, 8, 8]])
    expect(await press("PageUp", 1)).to.be.equal([[2, 8, 8]])
    expect(await press("ArrowLeft", 7)).to.be.equal([[2, 7, 8], [2, 6, 8], [2, 5, 8], [2, 4, 8], [2, 3, 8], [2, 2, 8], [2, 2, 8]])
    expect(await press("PageDown", 1)).to.be.equal([[2, 2, 8]])
  })

  it("should move only the nearest handle on wheel", async () => {
    const slider = MultiValuedSlider.create({start: 0, end: 10, step: 1, value: [2, 5, 8]})
    const {view} = await display(slider, [300, 50])
    const {track} = elements(view)

    track.dispatchEvent(new WheelEvent("wheel", {bubbles: true, composed: true, deltaY: -120, ...on_track(track, 0.75)}))
    await view.ready
    expect(slider.value).to.be.equal([2, 5, 9])
  })

  it("should support reversed sliders", async () => {
    const slider = MultiValuedSlider.create({start: 10, end: 0, step: 1, value: [2, 5, 8]})
    const {view} = await display(slider, [300, 50])
    const {track} = elements(view)

    // 0.1 of the track from the left is value 9 when reversed, nearest to the handle at 8
    await drag(view, track, on_track(track, 0.1), 0.1)
    expect(slider.value).to.be.equal([2, 5, 9])
  })
})

describe("DateSliderView", () => {
  it("should convert steps from 1 day in the model to 86_400_000 milliseconds in the slider element", async () => {
    const start = 1451606400000 // 01 Jan 2016
    const end = 1451952000000 // 05 Jan 2016
    const value = 1451779200000 // 03 Jan 2016
    const slider = DateSlider.create({start, end, value, step: 1})
    const {view} = await display(slider, null)
    expect(view.meta.step).to.be.equal(86_400_000)

    const {handles: [handle]} = elements(view)
    handle.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight"}))
    await view.ready
    expect(slider.value).to.be.equal(value + 86_400_000)
  })
})

describe("DateSlider", () => {
  it("should support string format", async () => {
    const slider = DateSlider.create({format: "%Y"})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(1599402993268)).to.be.equal("2020")
  })

  it("should support TickFormatter format", async () => {
    const format = CustomJSTickFormatter.create({code: "return Math.floor(1970 + tick/(1000*60*60*24*365)).toFixed(0)"})
    const slider = DateSlider.create({format})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(1599402993268)).to.be.equal("2020")
  })
})

describe("DateRangeSliderView", () => {
  it("should convert steps from 1 day in the model to 86_400_000 milliseconds in the slider element", async () => {
    const start = 1451606400000 // 01 Jan 2016
    const end = 1451952000000 // 05 Jan 2016
    const slider = DateRangeSlider.create({start, end, value: [start, end], step: 1})
    const {view} = await display(slider, null)
    expect(view.meta.step).to.be.equal(86_400_000)

    const {handles: [handle0]} = elements(view)
    handle0.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight"}))
    await view.ready
    expect(slider.value).to.be.equal([start + 86_400_000, end])
  })
})

describe("DateRangeSlider", () => {
  it("should support string format", async () => {
    const slider = DateRangeSlider.create({format: "%Y"})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(1599402993268)).to.be.equal("2020")
  })

  it("should support TickFormatter format", async () => {
    const format = CustomJSTickFormatter.create({code: "return Math.floor(1970 + tick/(1000*60*60*24*365)).toFixed(0)"})
    const slider = DateRangeSlider.create({format})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(1599402993268)).to.be.equal("2020")
  })
})

describe("DatetimeRangeSlider", () => {
  it("should support string format", async () => {
    const datetime = 1648211696000  // 2022-03-25 12:34:56

    const slider0 = DatetimeRangeSlider.create({format: "%Y %B %d"})
    const view0 = await build_view(slider0, {parent: null})
    expect(view0.pretty(datetime)).to.be.equal("2022 March 25")

    const slider1 = DatetimeRangeSlider.create({format: "%H:%M:%S"})
    const view1 = await build_view(slider1, {parent: null})
    expect(view1.pretty(datetime)).to.be.equal("12:34:56")
  })

  it("should support TickFormatter format", async () => {
    const format = CustomJSTickFormatter.create({code: "return Math.floor(1970 + tick/(1000*60*60*24*365)).toFixed(0)"})
    const slider = DatetimeRangeSlider.create({format})
    const view = await build_view(slider, {parent: null})
    expect(view.pretty(1648211696000)).to.be.equal("2022")
  })
})

describe("AbstractSliderView gestures", () => {
  it("should support dragging a handle and update value_throttled only at the end", async () => {
    const slider = Slider.create({start: 0, end: 10, step: 1, value: 0})
    const {view} = await display(slider, [300, 50])
    const {track, handles: [handle]} = elements(view)

    handle.dispatchEvent(new PointerEvent("pointerdown", {...pointer, ...center(handle)}))
    handle.dispatchEvent(new PointerEvent("pointermove", {...pointer, ...on_track(track, 0.5)}))
    await view.ready
    expect(slider.value).to.be.equal(5)
    expect(slider.properties.value_throttled.is_unset).to.be.true

    handle.dispatchEvent(new PointerEvent("pointerup", {...pointer, ...on_track(track, 0.7)}))
    await view.ready
    expect(slider.value).to.be.equal(7)
    expect(slider.value_throttled).to.be.equal(7)
  })

  it("should commit value_throttled when a drag is cancelled", async () => {
    const slider = Slider.create({start: 0, end: 10, step: 1, value: 0})
    const {view} = await display(slider, [300, 50])
    const {track, handles: [handle]} = elements(view)

    handle.dispatchEvent(new PointerEvent("pointerdown", {...pointer, ...center(handle)}))
    handle.dispatchEvent(new PointerEvent("pointermove", {...pointer, ...on_track(track, 0.3)}))
    handle.dispatchEvent(new PointerEvent("pointercancel", {...pointer}))
    await view.ready
    expect(slider.value).to.be.equal(3)
    expect(slider.value_throttled).to.be.equal(3)
  })

  it("should jump to the pointer when pressing the track and continue dragging", async () => {
    const slider = Slider.create({start: 0, end: 10, step: 1, value: 0})
    const {view} = await display(slider, [300, 50])
    const {track} = elements(view)

    track.dispatchEvent(new PointerEvent("pointerdown", {...pointer, ...on_track(track, 0.8)}))
    await view.ready
    expect(slider.value).to.be.equal(8)

    track.dispatchEvent(new PointerEvent("pointermove", {...pointer, ...on_track(track, 0.6)}))
    track.dispatchEvent(new PointerEvent("pointerup", {...pointer, ...on_track(track, 0.6)}))
    await view.ready
    expect(slider.value).to.be.equal(6)
    expect(slider.value_throttled).to.be.equal(6)
  })

  it("should ignore non-primary pointers and buttons other than the main one", async () => {
    const slider = Slider.create({start: 0, end: 10, step: 1, value: 0})
    const {view} = await display(slider, [300, 50])
    const {track, handles: [handle]} = elements(view)

    track.dispatchEvent(new PointerEvent("pointerdown", {...pointer, button: 2, ...on_track(track, 0.5)}))
    await view.ready
    expect(slider.value).to.be.equal(0)

    handle.dispatchEvent(new PointerEvent("pointerdown", {...pointer, ...center(handle)}))
    track.dispatchEvent(new PointerEvent("pointerdown", {...pointer, pointerId: 2, isPrimary: false, ...on_track(track, 0.5)}))
    handle.dispatchEvent(new PointerEvent("pointerup", {...pointer, ...on_track(track, 0.2)}))
    await view.ready
    expect(slider.value).to.be.equal(2)
  })

  it("should move the nearest handle when pressing the track of a range slider", async () => {
    const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [2, 8]})
    const {view} = await display(slider, [300, 50])
    const {track} = elements(view)

    await drag(view, track, on_track(track, 0.7), 0.7)
    expect(slider.value).to.be.equal([2, 7])
  })

  it("should support dragging the span of a range slider and preserve its width", async () => {
    const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [2, 5]})
    const {view} = await display(slider, [300, 50])
    const {track, span} = elements(view)
    expect_not_null(span)

    await drag(view, span, on_track(track, 0.35), 0.45)
    expect(slider.value).to.be.equal([3, 6])

    await drag(view, span, on_track(track, 0.45), 1.0)
    expect(slider.value).to.be.equal([7, 10])
  })

  it("should mark both handles as dragged when dragging the span of a range slider", async () => {
    const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [2, 5]})
    const {view} = await display(slider, [300, 50])
    const {track, span, handles} = elements(view)
    expect_not_null(span)

    const dragged = () => handles.map((el) => el.classList.contains(slider_css.dragging))
    expect(dragged()).to.be.equal([false, false])

    span.dispatchEvent(new PointerEvent("pointerdown", {...pointer, ...on_track(track, 0.35)}))
    span.dispatchEvent(new PointerEvent("pointermove", {...pointer, ...on_track(track, 0.45)}))
    await view.ready
    expect(dragged()).to.be.equal([true, true])

    span.dispatchEvent(new PointerEvent("pointerup", {...pointer, ...on_track(track, 0.45)}))
    await view.ready
    expect(dragged()).to.be.equal([false, false])
  })

  it("should mark only the dragged handle of a range slider", async () => {
    const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [5, 5]})
    const {view} = await display(slider, [300, 50])
    const {track, handles} = elements(view)
    const [, handle1] = handles

    const dragged = () => handles.map((el) => el.classList.contains(slider_css.dragging))

    handle1.dispatchEvent(new PointerEvent("pointerdown", {...pointer, ...center(handle1)}))
    await view.ready
    expect(dragged()).to.be.equal([false, true])

    // separating overlapping handles transfers the drag to the first handle
    handle1.dispatchEvent(new PointerEvent("pointermove", {...pointer, ...on_track(track, 0.3)}))
    await view.ready
    expect(dragged()).to.be.equal([true, false])

    handle1.dispatchEvent(new PointerEvent("pointerup", {...pointer, ...on_track(track, 0.3)}))
    await view.ready
    expect(dragged()).to.be.equal([false, false])
  })

  it("should make the span of a range slider focusable between handles", async () => {
    const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [2, 5]})
    const {view} = await display(slider, [300, 50])
    const {track, span, handles: [handle0, handle1]} = elements(view)
    expect_not_null(span)

    expect(span.tabIndex).to.be.equal(0)
    expect(span.role).to.be.equal("slider")
    expect(span.ariaValueText).to.be.equal("2 to 5")
    expect([...track.children]).to.be.equal([handle0, span, handle1])

    slider.disabled = true
    await view.ready
    expect(span.tabIndex).to.be.equal(-1)
  })

  it("should order handles and the span of a reversed range slider in visual order", async () => {
    // reversed vertical sliders have minimum at the top
    for (const [orientation, order] of [["horizontal", ["5", "2"]], ["vertical", ["2", "5"]]] as const) {
      const slider = RangeSlider.create({start: 10, end: 0, step: 1, value: [2, 5], orientation})
      const {view} = await display(slider, orientation == "horizontal" ? [300, 50] : [50, 300])
      const {track, span, handles} = elements(view)
      expect_not_null(span)

      // handles are queried in DOM (i.e. tab) order
      const [first, second] = handles
      expect([...track.children]).to.be.equal([first, span, second])
      expect(handles.map((el) => el.ariaValueText)).to.be.equal([...order])

      const position = (el: HTMLElement) => orientation == "horizontal" ? center(el).clientX : center(el).clientY
      expect(position(first) < position(span) && position(span) < position(second)).to.be.true

      // handles are still associated with correct values
      const upper = handles.find((el) => el.ariaValueText == "5")!
      upper.dispatchEvent(new KeyboardEvent("keydown", {key: "End"}))
      await view.ready
      expect(slider.value).to.be.equal([2, 10])
      expect(upper.ariaValueText).to.be.equal("10")
    }
  })

  it("should order handles of multi-valued sliders in visual order", async () => {
    const cases = [
      {start: 0, end: 10, orientation: "horizontal", order: ["2", "5", "8"]},
      {start: 10, end: 0, orientation: "horizontal", order: ["8", "5", "2"]},
      {start: 0, end: 10, orientation: "vertical", order: ["8", "5", "2"]},
      {start: 10, end: 0, orientation: "vertical", order: ["2", "5", "8"]},
    ] as const
    for (const {start, end, orientation, order} of cases) {
      const slider = MultiValuedSlider.create({start, end, step: 1, value: [2, 5, 8], orientation})
      const {view} = await display(slider, orientation == "horizontal" ? [300, 50] : [50, 300])
      const {handles} = elements(view)
      expect(handles.map((el) => el.ariaValueText)).to.be.equal([...order])

      const positions = handles.map((el) => orientation == "horizontal" ? center(el).clientX : center(el).clientY)
      expect(positions[0] < positions[1] && positions[1] < positions[2]).to.be.true
    }
  })

  it("should support keyboard and wheel in all orientations", async () => {
    // arrows along the axis move in their visual direction, arrows across the axis, page
    // up/down and home/end follow value semantics, and scrolling behaves like arrow up/down
    type Expected = {[key: string]: number}
    const value_semantics = {ArrowUp: 6, ArrowDown: 4, ArrowRight: 6, ArrowLeft: 4, PageUp: 10, PageDown: 0, Home: 0, End: 10}
    const cases: [orientation: "horizontal" | "vertical", reversed: boolean, expected: Expected][] = [
      ["horizontal", false, {...value_semantics, WheelUp: 6, WheelDown: 4}],
      ["horizontal", true,  {...value_semantics, ArrowRight: 4, ArrowLeft: 6, WheelUp: 6, WheelDown: 4}],
      ["vertical",   false, {...value_semantics, WheelUp: 6, WheelDown: 4}],
      ["vertical",   true,  {...value_semantics, ArrowUp: 4, ArrowDown: 6, WheelUp: 4, WheelDown: 6}],
    ]
    for (const [orientation, reversed, expected] of cases) {
      const [start, end] = reversed ? [10, 0] : [0, 10]
      const slider = Slider.create({start, end, step: 1, value: 5, orientation})
      const {view} = await display(slider, orientation == "horizontal" ? [300, 50] : [50, 300])
      const {track, handles: [handle]} = elements(view)

      const results: Expected = {}
      for (const key of Object.keys(expected)) {
        slider.value = 5
        await view.ready
        if (key.startsWith("Wheel")) {
          const deltaY = key == "WheelUp" ? -120 : 120
          track.dispatchEvent(new WheelEvent("wheel", {bubbles: true, composed: true, deltaY, ...center(track)}))
        } else {
          handle.dispatchEvent(new KeyboardEvent("keydown", {key}))
        }
        await view.ready
        results[key] = slider.value
      }
      expect({orientation, reversed, results}).to.be.equal({orientation, reversed, results: expected})
    }
  })

  it("should have minimum at the bottom of vertical sliders", async () => {
    const slider = Slider.create({start: 0, end: 10, step: 1, value: 2, orientation: "vertical"})
    const {view} = await display(slider, [50, 300])
    const {track, span, handles: [handle]} = elements(view)
    expect_not_null(span)

    // the span fills from the bottom
    const track_box = track.getBoundingClientRect()
    const span_box = span.getBoundingClientRect()
    expect(abs(span_box.bottom - (track_box.bottom - track.clientTop)) < 1).to.be.true
    expect(abs(center(handle).clientY - on_vtrack(track, 0.8).clientY) < 1).to.be.true

    // pressing the track
    await drag(view, track, on_vtrack(track, 0.1), 0.1, on_vtrack)
    expect(slider.value).to.be.equal(9)

    // dragging up increases the value
    await drag(view, handle, center(handle), 0.3, on_vtrack)
    expect(slider.value).to.be.equal(7)

    // keyboard
    for (const [key, value] of [["ArrowUp", 8], ["ArrowDown", 7], ["PageUp", 10], ["PageDown", 5], ["End", 10], ["Home", 0]] as const) {
      handle.dispatchEvent(new KeyboardEvent("keydown", {key}))
      await view.ready
      expect(slider.value).to.be.equal(value)
    }

    // scrolling up increases the value
    track.dispatchEvent(new WheelEvent("wheel", {bubbles: true, composed: true, deltaY: -120, ...on_vtrack(track, 0.5)}))
    await view.ready
    expect(slider.value).to.be.equal(1)
  })

  it("should have minimum at the top of reversed vertical sliders", async () => {
    const slider = Slider.create({start: 10, end: 0, step: 1, value: 2, orientation: "vertical"})
    const {view} = await display(slider, [50, 300])
    const {track, span, handles: [handle]} = elements(view)
    expect_not_null(span)

    const track_box = track.getBoundingClientRect()
    const span_box = span.getBoundingClientRect()
    expect(abs(span_box.top - (track_box.top + track.clientTop)) < 1).to.be.true
    expect(abs(center(handle).clientY - on_vtrack(track, 0.2).clientY) < 1).to.be.true

    await drag(view, track, on_vtrack(track, 0.1), 0.1, on_vtrack)
    expect(slider.value).to.be.equal(1)

    // arrows move the handle in their visual direction
    handle.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowDown"}))
    await view.ready
    expect(slider.value).to.be.equal(2)
    handle.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowUp"}))
    await view.ready
    expect(slider.value).to.be.equal(1)
  })

  it("should not make the span of a single value slider focusable", async () => {
    const slider = Slider.create({start: 0, end: 10, step: 1, value: 5})
    const {view} = await display(slider, [300, 50])
    const {span} = elements(view)
    expect_not_null(span)
    expect(span.tabIndex).to.be.equal(-1)
    expect(span.role).to.be.null
  })

  it("should focus the span of a range slider when dragging it", async () => {
    const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [2, 5]})
    const {view} = await display(slider, [300, 50])
    const {track, span} = elements(view)
    expect_not_null(span)

    await drag(view, span, on_track(track, 0.35), 0.45)
    expect(view.shadow_el.activeElement).to.be.equal(span)
  })

  it("should support keyboard on the span of a range slider and preserve its width", async () => {
    const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [2, 5]})
    const {view} = await display(slider, [300, 50])
    const {span} = elements(view)
    expect_not_null(span)

    async function press(key: string): Promise<boolean> {
      const event = new KeyboardEvent("keydown", {key, cancelable: true})
      span!.dispatchEvent(event)
      span!.dispatchEvent(new KeyboardEvent("keyup", {key}))
      await view.ready
      return event.defaultPrevented
    }

    expect(await press("ArrowRight")).to.be.true
    expect(slider.value).to.be.equal([3, 6])
    expect(slider.value_throttled).to.be.equal([3, 6])

    await press("ArrowLeft")
    expect(slider.value).to.be.equal([2, 5])

    await press("End")
    expect(slider.value).to.be.equal([7, 10])

    await press("ArrowRight")
    expect(slider.value).to.be.equal([7, 10])

    await press("Home")
    expect(slider.value).to.be.equal([0, 3])

    await press("PageUp")
    expect(slider.value).to.be.equal([5, 8])

    expect(await press("a")).to.be.false
    expect(slider.value).to.be.equal([5, 8])
  })

  it("should not allow handles of a range slider to cross", async () => {
    const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [2, 5]})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle0]} = elements(view)

    await drag(view, handle0, center(handle0), 0.9)
    expect(slider.value).to.be.equal([5, 5])
  })

  it("should allow separating overlapping handles of a range slider", async () => {
    const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [10, 10]})
    const {view} = await display(slider, [300, 50])
    const {handles: [, handle1]} = elements(view)

    await drag(view, handle1, center(handle1), 0.4)
    expect(slider.value).to.be.equal([4, 10])
  })

  it("should support keyboard and respect handle ordering", async () => {
    const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [2, 5]})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle0, handle1]} = elements(view)

    const event = new KeyboardEvent("keydown", {key: "Home", cancelable: true})
    handle1.dispatchEvent(event)
    await view.ready
    expect(slider.value).to.be.equal([2, 2])
    expect(event.defaultPrevented).to.be.true

    // the focused handle stops at its neighbor, instead of pushing it
    handle1.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowLeft"}))
    await view.ready
    expect(slider.value).to.be.equal([2, 2])

    handle0.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight"}))
    await view.ready
    expect(slider.value).to.be.equal([2, 2])

    // but either of overlapping handles can move away from the other
    handle0.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowLeft"}))
    await view.ready
    expect(slider.value).to.be.equal([1, 2])

    handle1.dispatchEvent(new KeyboardEvent("keydown", {key: "End"}))
    await view.ready
    expect(slider.value).to.be.equal([1, 10])
  })

  it("should not fail when start == end", async () => {
    const slider = Slider.create({start: 5, end: 5, step: 1, value: 5})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle]} = elements(view)

    handle.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight"}))
    await view.ready
    expect(slider.value).to.be.equal(5)
  })
})

describe("AbstractSliderView meta", () => {
  it("should not be recomputed when the value changes", async () => {
    const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [2, 5]})
    const {view} = await display(slider, [300, 50])

    const meta = view.meta
    expect(view.handle_values).to.be.equal([2, 5])

    const {handles: [handle0]} = elements(view)
    handle0.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight"}))
    await view.ready
    slider.value = [4, 6]
    await view.ready

    expect(view.meta).to.be.identical(meta)
    expect(view.handle_values).to.be.equal([4, 6])
  })

  it("should be recomputed when start, end or step change", async () => {
    const slider = Slider.create({start: 0, end: 10, step: 1, value: 5})
    const {view} = await display(slider, [300, 50])

    const meta0 = view.meta
    slider.end = 20
    await view.ready
    const meta1 = view.meta
    expect(meta1).to.not.be.identical(meta0)
    expect(meta1.max).to.be.equal(20)

    slider.step = 2
    await view.ready
    const meta2 = view.meta
    expect(meta2).to.not.be.identical(meta1)
    expect(meta2.step).to.be.equal(2)
  })

  it("should be recomputed when categories change", async () => {
    const slider = CategoricalSlider.create({categories: ["a", "b", "c"], value: "b"})
    const {view} = await display(slider, [300, 50])
    expect(view.meta.max).to.be.equal(2)

    slider.categories = ["a", "b", "c", "d", "e"]
    await view.ready
    expect(view.meta.max).to.be.equal(4)
    expect(view.meta.compute("e")).to.be.equal(4)
  })
})

describe("AbstractSliderView snapping", () => {
  it("should snap to multiples of step and to maximum", async () => {
    // valid values are 0, 3, 6, 9 and 10
    const slider = Slider.create({start: 0, end: 10, step: 3, value: 0})
    const {view} = await display(slider, [300, 50])
    const {track} = elements(view)

    const snapped = []
    for (const at of [0.0, 0.1, 0.2, 0.4, 0.5, 0.85, 0.94, 0.96, 1.0]) {
      await drag(view, track, on_track(track, at), at)
      snapped.push(slider.value)
    }
    expect(snapped).to.be.equal([0, 0, 3, 3, 6, 9, 9, 10, 10])
  })

  it("should snap without accumulating rounding errors", async () => {
    const slider = Slider.create({start: 0, end: 100, step: 0.1, value: 0})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle]} = elements(view)

    handle.dispatchEvent(new KeyboardEvent("keydown", {key: "End"}))
    handle.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowLeft"}))
    await view.ready
    expect(slider.value).to.be.equal(99.9)
  })

  it("should snap without floating point noise", async () => {
    // repeated steps would otherwise produce e.g. 0.30000000000000004 instead of 0.3
    const cases = [
      {start: 0, end: 1, step: 0.1, value: 0, presses: 3, expected: 0.3},
      {start: 0.05, end: 1, step: 0.1, value: 0.05, presses: 2, expected: 0.25},
      {start: 0, end: 1e-5, step: 1e-7, value: 0, presses: 3, expected: 3e-7},
      {start: 1, end: 2, step: 0.01, value: 1, presses: 7, expected: 1.07},
    ]
    for (const {start, end, step, value, presses, expected} of cases) {
      const slider = Slider.create({start, end, step, value})
      const {view} = await display(slider, [300, 50])
      const {handles: [handle]} = elements(view)
      for (let i = 0; i < presses; i++) {
        handle.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight"}))
      }
      await view.ready
      expect({step, value: slider.value}).to.be.equal({step, value: expected})
    }
  })

  it("should support a very large number of steps", async () => {
    // e.g. a year with a step of 1 ms, which used to exceed maximum array length
    const start = Date.UTC(2026, 0, 1)
    const end = Date.UTC(2027, 0, 1)
    const slider = DatetimeRangeSlider.create({start, end, step: 1, value: [start, end]})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle0]} = elements(view)

    handle0.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight"}))
    await view.ready
    expect(slider.value).to.be.equal([start + 1, end])

    handle0.dispatchEvent(new KeyboardEvent("keydown", {key: "PageUp"}))
    await view.ready
    const [v0] = slider.value
    expect(v0 > start + 1).to.be.true
    expect(Number.isInteger(v0)).to.be.true
  })
})

describe("AbstractSliderView page up/down", () => {
  async function page_up_down(view: AbstractSliderView<unknown>, handle: HTMLElement): Promise<[unknown, unknown]> {
    handle.dispatchEvent(new KeyboardEvent("keydown", {key: "PageUp"}))
    await view.ready
    const up = view.model.value
    handle.dispatchEvent(new KeyboardEvent("keydown", {key: "PageDown"}))
    await view.ready
    const down = view.model.value
    return [up, down]
  }

  it("should move by step_multiplier steps (5 by default)", async () => {
    const cases = [
      {start: 0, end: 1, step: 1, value: 0, up: 1},        // limited by the range
      {start: 0, end: 10, step: 1, value: 0, up: 5},
      {start: 0, end: 100, step: 1, value: 0, up: 5},
      {start: 0, end: 10, step: 3, value: 0, up: 10},      // 15, limited by the range
      {start: 0, end: 10, step: null, value: 0, up: 2.5},  // continuous, 5*5% of span
    ]
    for (const {start, end, step, value, up} of cases) {
      const slider = Slider.create({start, end, step, value})
      const {view} = await display(slider, [300, 50])
      const {handles: [handle]} = elements(view)
      expect({start, end, step, result: await page_up_down(view, handle)}).to.be.equal({start, end, step, result: [up, value]})
    }
  })

  it("should support configurable step_multiplier", async () => {
    const cases = [
      {end: 10, step: 1, step_multiplier: 1, up: 1},
      {end: 10, step: 1, step_multiplier: 2, up: 2},
      {end: 100, step: 1, step_multiplier: 10, up: 10},
      {end: 100, step: 2, step_multiplier: 10, up: 20},
      {end: 10, step: null, step_multiplier: 2, up: 1},      // continuous, 2*5% of span
    ]
    for (const {end, step, step_multiplier, up} of cases) {
      const slider = Slider.create({start: 0, end, step, value: 0, step_multiplier})
      const {view} = await display(slider, [300, 50])
      const {handles: [handle]} = elements(view)
      expect({end, step, step_multiplier, result: await page_up_down(view, handle)}).to.be.equal({end, step, step_multiplier, result: [up, 0]})
    }
  })

  it("should support configurable default_step for sliders without step", async () => {
    const cases = [
      {default_step: 0.05, arrow: 0.5, page: 2.5},  // default
      {default_step: 0.01, arrow: 0.1, page: 0.5},
      {default_step: 0.1, arrow: 1, page: 5},
      {default_step: 0.5, arrow: 5, page: 10},      // limited by the range
    ]
    for (const {default_step, arrow, page} of cases) {
      const slider = Slider.create({start: 0, end: 10, step: null, value: 0, default_step})
      const {view} = await display(slider, [300, 50])
      const {handles: [handle]} = elements(view)

      handle.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight"}))
      await view.ready
      const arrow_value = slider.value

      slider.value = 0
      await view.ready
      handle.dispatchEvent(new KeyboardEvent("keydown", {key: "PageUp"}))
      await view.ready
      const page_value = slider.value

      expect({default_step, arrow: arrow_value, page: page_value}).to.be.equal({default_step, arrow, page})
    }
  })

  it("should require positive default_step", () => {
    const slider = Slider.create({start: 0, end: 10, step: null, value: 0})
    expect(() => slider.default_step = 0).to.throw()
    expect(() => slider.default_step = 1.5).to.throw()
    slider.default_step = 1
    expect(slider.default_step).to.be.equal(1)
  })

  it("should ignore default_step for sliders with step", async () => {
    const slider = Slider.create({start: 0, end: 10, step: 1, value: 0, default_step: 0.5})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle]} = elements(view)
    handle.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight"}))
    await view.ready
    expect(slider.value).to.be.equal(1)
  })

  it("should react to changes of step_multiplier", async () => {
    const slider = Slider.create({start: 0, end: 10, step: 1, value: 0})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle]} = elements(view)
    expect(await page_up_down(view, handle)).to.be.equal([5, 0])

    slider.step_multiplier = 3
    await view.ready
    expect(await page_up_down(view, handle)).to.be.equal([3, 0])
  })

  it("should support categorical sliders with two categories", async () => {
    const slider = CategoricalSlider.create({categories: ["no", "yes"], value: "no"})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle]} = elements(view)
    expect(await page_up_down(view, handle)).to.be.equal(["yes", "no"])
  })
})

describe("AbstractSliderView keyboard acceleration", () => {
  // returns value after each key press (an initial press followed by auto-repeated presses)
  async function hold(view: AbstractSliderView<unknown>, el: HTMLElement, key: string, presses: number, release: boolean = true): Promise<unknown[]> {
    const values = []
    for (let i = 0; i < presses; i++) {
      el.dispatchEvent(new KeyboardEvent("keydown", {key, repeat: i != 0}))
      await view.ready
      values.push(view.model.value)
    }
    if (release) {
      el.dispatchEvent(new KeyboardEvent("keyup", {key}))
    }
    return values
  }

  function steps(values: unknown[], start: number): number[] {
    return (values as number[]).map((v, i) => v - (i == 0 ? start : values[i - 1] as number))
  }

  it("should accelerate arrow keys when holding them", async () => {
    const slider = Slider.create({start: 0, end: 1000, step: 1, value: 0})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle]} = elements(view)

    const values = await hold(view, handle, "ArrowRight", 45)
    expect(steps(values, 0)).to.be.equal([
      ...Array(10).fill(1),  // initial press and 9 repeats
      ...Array(10).fill(2),
      ...Array(10).fill(4),
      ...Array(15).fill(8),  // maximum
    ])
    expect(slider.value).to.be.equal(10 + 20 + 40 + 120)
  })

  it("should reset acceleration when releasing a key or changing keys", async () => {
    const slider = Slider.create({start: 0, end: 1000, step: 1, value: 500})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle]} = elements(view)

    await hold(view, handle, "ArrowRight", 25)
    const value0 = slider.value
    expect(steps(await hold(view, handle, "ArrowRight", 1), value0)).to.be.equal([1])

    // changing keys while holding (repeated events of a different key) starts over
    await hold(view, handle, "ArrowRight", 25, false)
    const value1 = slider.value
    expect(steps(await hold(view, handle, "ArrowLeft", 3), value1)).to.be.equal([-1, -1, -1])
  })

  it("should reset acceleration when losing focus", async () => {
    const slider = RangeSlider.create({start: 0, end: 1000, step: 1, value: [200, 800]})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle0, handle1]} = elements(view)

    handle0.focus()
    await hold(view, handle0, "ArrowRight", 25, false)
    handle1.focus()
    const [, v1] = slider.value
    handle1.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight", repeat: true}))
    await view.ready
    expect(slider.value[1] - v1).to.be.equal(1)
  })

  it("should accelerate page up/down and support sliders without step", async () => {
    const stepped = Slider.create({start: 0, end: 10000, step: 1, value: 0, step_multiplier: 5})
    const {view: stepped_view} = await display(stepped, [300, 50])
    const {handles: [stepped_handle]} = elements(stepped_view)
    const stepped_values = await hold(stepped_view, stepped_handle, "PageUp", 12)
    expect(steps(stepped_values, 0)).to.be.equal([...Array(10).fill(5), 10, 10])

    const continuous = Slider.create({start: 0, end: 100, step: null, value: 0, default_step: 0.01})
    const {view: continuous_view} = await display(continuous, [300, 50])
    const {handles: [continuous_handle]} = elements(continuous_view)
    const continuous_values = await hold(continuous_view, continuous_handle, "ArrowRight", 12)
    expect(steps(continuous_values, 0).map((v) => round(v*100)/100)).to.be.equal([...Array(10).fill(1), 2, 2])
  })

  it("should update value_throttled only when releasing a key", async () => {
    const slider = Slider.create({start: 0, end: 1000, step: 1, value: 0})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle]} = elements(view)

    const value_changes: unknown[] = []
    const value_throttled_changes: unknown[] = []
    slider.properties.value.change.connect(() => value_changes.push(slider.value))
    slider.properties.value_throttled.change.connect(() => value_throttled_changes.push(slider.value_throttled))

    await hold(view, handle, "ArrowRight", 12, false)
    expect(value_changes.length).to.be.equal(12)
    expect(value_throttled_changes).to.be.equal([])
    expect(slider.properties.value_throttled.is_unset).to.be.true

    handle.dispatchEvent(new KeyboardEvent("keyup", {key: "ArrowRight"}))
    await view.ready
    expect(value_throttled_changes).to.be.equal([14])

    // a single key press commits once as well
    await hold(view, handle, "ArrowLeft", 1)
    expect(value_throttled_changes).to.be.equal([14, 13])

    // releasing an unrelated key doesn't commit
    handle.dispatchEvent(new KeyboardEvent("keyup", {key: "Shift"}))
    await view.ready
    expect(value_throttled_changes).to.be.equal([14, 13])
  })

  it("should update value_throttled when losing focus while holding a key", async () => {
    const slider = Slider.create({start: 0, end: 1000, step: 1, value: 0})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle]} = elements(view)

    handle.focus()
    await hold(view, handle, "ArrowRight", 3, false)
    expect(slider.properties.value_throttled.is_unset).to.be.true

    handle.blur()
    await view.ready
    expect(slider.value_throttled).to.be.equal(3)
  })

  it("should support configurable acceleration", async () => {
    const slider = Slider.create({start: 0, end: 1000, step: 1, value: 0, acceleration_interval: 2, acceleration_max: 4})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle]} = elements(view)
    expect(steps(await hold(view, handle, "ArrowRight", 8), 0)).to.be.equal([1, 1, 2, 2, 4, 4, 4, 4])
  })

  it("should allow to disable acceleration", async () => {
    const slider = Slider.create({start: 0, end: 1000, step: 1, value: 0, acceleration_max: 1})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle]} = elements(view)
    expect(steps(await hold(view, handle, "ArrowRight", 25), 0)).to.be.equal(Array(25).fill(1))
  })

  it("should react to changes of acceleration properties", async () => {
    const slider = Slider.create({start: 0, end: 1000, step: 1, value: 0})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle]} = elements(view)

    slider.acceleration_interval = 1
    slider.acceleration_max = 2
    await view.ready
    expect(steps(await hold(view, handle, "ArrowRight", 4), 0)).to.be.equal([1, 2, 2, 2])
  })

  it("should require positive integer acceleration properties", () => {
    const slider = Slider.create({start: 0, end: 10, value: 0})
    expect(() => slider.acceleration_interval = 0).to.throw()
    expect(() => slider.acceleration_interval = 2.5).to.throw()
    expect(() => slider.acceleration_max = 0).to.throw()
  })

  it("should not affect home and end", async () => {
    const slider = Slider.create({start: 0, end: 1000, step: 1, value: 500})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle]} = elements(view)
    expect(await hold(view, handle, "End", 15)).to.be.equal(Array(15).fill(1000))
    expect(await hold(view, handle, "Home", 15)).to.be.equal(Array(15).fill(0))
  })
})

describe("AbstractSliderView title", () => {
  function title_el(view: AbstractSliderView<unknown>): HTMLElement {
    const el = view.shadow_el.querySelector<HTMLElement>(`.${slider_css.title} > span`)
    expect_not_null(el)
    return el
  }

  it("should not re-render the title when the value changes", async () => {
    const slider = Slider.create({start: 0, end: 10, step: 1, value: 5, title: "Volume"})
    const {view} = await display(slider, [300, 50])

    const el = title_el(view)
    expect(el.textContent).to.be.equal("Volume")
    const observer = new MutationObserver(() => {})
    observer.observe(el, {childList: true, characterData: true, subtree: true})

    for (const value of [6, 7, 8]) {
      slider.value = value
      await view.ready
    }

    expect(title_el(view)).to.be.equal(el)
    expect(observer.takeRecords()).to.be.equal([])
    observer.disconnect()

    slider.title = "Gain"
    await view.ready
    expect(title_el(view)).to.be.equal(el)
    expect(el.textContent).to.be.equal("Gain")
  })

  it("should process TeX in the title only when the title changes", async () => {
    const slider = Slider.create({start: 0, end: 10, step: 1, value: 5, title: "$$x$$"})
    const {view} = await display(slider, [300, 50])
    if (view.provider.MathJax == null) {
      return // TeX isn't processed without MathJax
    }
    expect(title_el(view).querySelector("svg")).to.not.be.null

    const process_tex = sinon.spy(view, "process_tex")
    try {
      for (const value of [6, 7, 8]) {
        slider.value = value
        await view.ready
      }
      expect(process_tex.callCount).to.be.equal(0)

      slider.title = "$$y$$"
      await view.ready
      expect(process_tex.callCount).to.be.equal(1)
      expect(title_el(view).querySelector("svg")).to.not.be.null
    } finally {
      process_tex.restore()
    }
  })
})

describe("AbstractSliderView accessibility", () => {
  type Aria = {name: string | null, now: string | null, min: string | null, max: string | null, text: string | null}

  // resolves aria-labelledby (within the shadow root) the same way as accessible name computation
  function aria(view: AbstractSliderView<unknown>, el: HTMLElement): Aria {
    const labelledby = el.getAttribute("aria-labelledby")
    const name = labelledby == null ? el.ariaLabel : labelledby.split(" ").map((id) => {
      const ref = view.shadow_el.getElementById(id)
      expect_not_null(ref)
      return ref == el ? el.ariaLabel : ref.textContent
    }).join(" ")
    return {name, now: el.ariaValueNow, min: el.ariaValueMin, max: el.ariaValueMax, text: el.ariaValueText}
  }

  it("should name a single value slider after its title and expose its value", async () => {
    const slider = Slider.create({start: 0, end: 10, step: 1, value: 5, title: "Volume"})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle]} = elements(view)
    expect(aria(view, handle)).to.be.equal({name: "Volume", now: "5", min: "0", max: "10", text: "5"})

    slider.value = 7
    await view.ready
    expect(aria(view, handle)).to.be.equal({name: "Volume", now: "7", min: "0", max: "10", text: "7"})
  })

  it("should not name a slider after its value when it has no title", async () => {
    const slider = Slider.create({start: 0, end: 10, step: 1, value: 5, title: ""})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle]} = elements(view)
    expect(aria(view, handle)).to.be.equal({name: null, now: "5", min: "0", max: "10", text: "5"})
  })

  it("should keep handles of stealth sliders focusable and show them when focused", async () => {
    const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [2, 5], title: "Price", appearance: "stealth"})
    const {view} = await display(slider, [300, 50])
    const {span, handles: [handle0, handle1]} = elements(view)
    expect_not_null(span)

    const opacity = () => [handle0, handle1].map((el) => getComputedStyle(el).opacity)
    const displayed = () => [handle0, handle1].every((el) => getComputedStyle(el).display != "none")

    expect(displayed()).to.be.true
    expect([handle0.tabIndex, span.tabIndex, handle1.tabIndex]).to.be.equal([0, 0, 0])
    expect(opacity()).to.be.equal(["0", "0"])

    // focus not originating from pointer interaction shows handles
    for (const el of [handle0, span, handle1]) {
      el.focus()
      await view.ready
      expect(el.classList.contains(slider_css.focus_visible)).to.be.true
      expect(opacity()).to.be.equal(["1", "1"])
    }

    handle1.blur()
    await view.ready
    expect(handle1.classList.contains(slider_css.focus_visible)).to.be.false
    expect(opacity()).to.be.equal(["0", "0"])
  })

  it("should not show focus indicators after dragging, but show them after using keyboard", async () => {
    const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [2, 5], appearance: "stealth"})
    const {view} = await display(slider, [300, 50])
    const {track, span, handles: [handle0, handle1]} = elements(view)
    expect_not_null(span)

    const focus_visible = () => [handle0, span, handle1].map((el) => el.classList.contains(slider_css.focus_visible))
    const opacity = () => [handle0, handle1].map((el) => getComputedStyle(el).opacity)
    const tooltips = () => [handle0, handle1].map((el) => getComputedStyle(el.querySelector(`.${slider_css.tooltip}`)!).display != "none")

    // keyboard focus, then dragging the focused handle
    handle0.focus()
    await view.ready
    expect(focus_visible()).to.be.equal([true, false, false])

    await drag(view, handle0, center(handle0), 0.3)
    expect(slider.value).to.be.equal([3, 5])
    expect(view.shadow_el.activeElement).to.be.equal(handle0)
    expect(focus_visible()).to.be.equal([false, false, false])
    expect(opacity()).to.be.equal(["0", "0"])
    expect(tooltips()).to.be.equal([false, false])

    // keyboard after pointer focus
    handle0.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight", bubbles: true, composed: true}))
    await view.ready
    expect(slider.value).to.be.equal([4, 5])
    expect(focus_visible()).to.be.equal([true, false, false])
    expect(opacity()).to.be.equal(["1", "1"])
    expect(tooltips()).to.be.equal([true, false])

    // dragging the span
    await drag(view, span, on_track(track, 0.45), 0.55)
    expect(slider.value).to.be.equal([5, 6])
    expect(view.shadow_el.activeElement).to.be.equal(span)
    expect(focus_visible()).to.be.equal([false, false, false])
    expect(tooltips()).to.be.equal([false, false])

    // focus moving with keyboard within the slider after pointer focus
    handle1.focus()
    await view.ready
    expect(focus_visible()).to.be.equal([false, false, false])
    handle1.dispatchEvent(new KeyboardEvent("keydown", {key: "Tab", bubbles: true, composed: true}))
    await view.ready
    expect(focus_visible()).to.be.equal([false, false, true])

    // focus leaving the slider resets pointer interaction
    handle1.blur()
    handle0.focus()
    await view.ready
    expect(focus_visible()).to.be.equal([true, false, false])
  })

  it("should expose numerically ordered bounds for reversed sliders", async () => {
    const slider = Slider.create({start: 10, end: 0, step: 1, value: 8, title: "Volume"})
    const {view} = await display(slider, [300, 50])
    const {handles: [handle]} = elements(view)
    expect(aria(view, handle)).to.be.equal({name: "Volume", now: "8", min: "0", max: "10", text: "8"})
  })

  it("should expose bounds constrained by neighbors and distinct names for range sliders", async () => {
    const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [2, 5], title: "Price"})
    const {view} = await display(slider, [300, 50])
    const {span, handles: [handle0, handle1]} = elements(view)
    expect_not_null(span)

    expect(aria(view, handle0)).to.be.equal({name: "Price minimum", now: "2", min: "0", max: "5", text: "2"})
    expect(aria(view, handle1)).to.be.equal({name: "Price maximum", now: "5", min: "2", max: "10", text: "5"})
    expect(aria(view, span)).to.be.equal({name: "Price range", now: "2", min: "0", max: "7", text: "2 to 5"})

    span.dispatchEvent(new KeyboardEvent("keydown", {key: "End"}))
    await view.ready
    expect(aria(view, handle0)).to.be.equal({name: "Price minimum", now: "7", min: "0", max: "10", text: "7"})
    expect(aria(view, handle1)).to.be.equal({name: "Price maximum", now: "10", min: "7", max: "10", text: "10"})
    expect(aria(view, span)).to.be.equal({name: "Price range", now: "7", min: "0", max: "7", text: "7 to 10"})
  })

  it("should name handles of a range slider without a title by their roles", async () => {
    const slider = RangeSlider.create({start: 0, end: 10, step: 1, value: [2, 5], title: null})
    const {view} = await display(slider, [300, 50])
    const {span, handles: [handle0, handle1]} = elements(view)
    expect_not_null(span)
    expect([handle0, span, handle1].map((el) => aria(view, el).name)).to.be.equal(["minimum", "range", "maximum"])
  })

  it("should expose bounds constrained by neighbors and distinct names for multi-valued sliders", async () => {
    const slider = MultiValuedSlider.create({start: 0, end: 10, step: 1, value: [2, 5, 8], title: "Levels"})
    const {view} = await display(slider, [300, 50])
    const {handles} = elements(view)
    expect(handles.map((el) => aria(view, el))).to.be.equal([
      {name: "Levels 1 of 3", now: "2", min: "0", max: "5", text: "2"},
      {name: "Levels 2 of 3", now: "5", min: "2", max: "8", text: "5"},
      {name: "Levels 3 of 3", now: "8", min: "5", max: "10", text: "8"},
    ])
  })

  it("should expose numerical values and formatted text for date and categorical sliders", async () => {
    const start = Date.UTC(2026, 0, 1)
    const end = Date.UTC(2026, 11, 31)
    const value = Date.UTC(2026, 3, 3)
    const date_slider = DateSlider.create({start, end, value, title: "Date"})
    const {view: date_view} = await display(date_slider, [300, 50])
    const {handles: [date_handle]} = elements(date_view)
    expect(aria(date_view, date_handle)).to.be.equal({name: "Date", now: `${value}`, min: `${start}`, max: `${end}`, text: "03 Apr 2026"})

    const cat_slider = CategoricalSlider.create({categories: ["A", "B", "C"], value: "B", title: "Category"})
    const {view: cat_view} = await display(cat_slider, [300, 50])
    const {handles: [cat_handle]} = elements(cat_view)
    expect(aria(cat_view, cat_handle)).to.be.equal({name: "Category", now: "1", min: "0", max: "2", text: "B"})
  })
})
