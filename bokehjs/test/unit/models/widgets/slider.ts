import {expect, expect_not_null} from "#framework/assertions"
import * as sinon from "sinon"
import {display} from "#framework/layouts"

import {Slider, RangeSlider, MultiValuedSlider, DateSlider, DateRangeSlider, DatetimeRangeSlider} from "@bokehjs/models/widgets"
import {CustomJSTickFormatter} from "@bokehjs/models/formatters"
import {isInteger} from "@bokehjs/core/util/types"
import {pairwise} from "@bokehjs/core/util/array"
import {build_view} from "@bokehjs/core/build_views"
import * as slider_css from "@bokehjs/styles/widgets/sliders.css"
import type {AbstractSliderView} from "@bokehjs/models/widgets/sliders/abstract_slider"

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

function center(el: HTMLElement): {clientX: number, clientY: number} {
  const {left, top, width, height} = el.getBoundingClientRect()
  return {clientX: left + width/2, clientY: top + height/2}
}

const pointer = {bubbles: true, composed: true, isPrimary: true, pointerType: "mouse", pointerId: 1, button: 0}

async function drag(view: AbstractSliderView<unknown>, el: HTMLElement, from: {clientX: number, clientY: number}, to_at: number): Promise<void> {
  const {track} = elements(view)
  el.dispatchEvent(new PointerEvent("pointerdown", {...pointer, ...from}))
  el.dispatchEvent(new PointerEvent("pointermove", {...pointer, ...on_track(track, to_at)}))
  el.dispatchEvent(new PointerEvent("pointerup", {...pointer, ...on_track(track, to_at)}))
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
})

describe("MultiValuedSlider", () => {
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

    const {ticks} = view.meta
    expect_not_null(ticks)

    const steps = pairwise(ticks, (t0, t1) => t1 - t0)
    expect(steps).to.be.equal([86_400_000, 86_400_000, 86_400_000, 86_400_000])
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

    const {ticks} = view.meta
    expect_not_null(ticks)

    const steps = pairwise(ticks, (t0, t1) => t1 - t0)
    expect(steps).to.be.equal([86_400_000, 86_400_000, 86_400_000, 86_400_000])
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
    const {handles: [, handle1]} = elements(view)

    const event = new KeyboardEvent("keydown", {key: "Home", cancelable: true})
    handle1.dispatchEvent(event)
    await view.ready
    expect(slider.value).to.be.equal([2, 2])
    expect(event.defaultPrevented).to.be.true

    handle1.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowLeft"}))
    await view.ready
    expect(slider.value).to.be.equal([1, 2])
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
