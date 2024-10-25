import type {PlotView} from "@bokehjs/models/plots/plot_canvas"
import {MouseButton, offset_bbox} from "@bokehjs/core/dom"
import {linspace, zip, last} from "@bokehjs/core/util/array"
import {delay} from "@bokehjs/core/util/defer"
import {assert} from "@bokehjs/core/util/assert"
import type {KeyModifiers} from "@bokehjs/core/ui_events"
import {UIGestures} from "@bokehjs/core/ui_gestures"
import {isString} from "@bokehjs/core/util/types"

export type Point = {x: number, y: number}
export type XY = Point

export function xy(x: number, y: number): Point {
  return {x, y}
}

const _event_common: Partial<UIEventInit> = {
  bubbles: true,
  composed: true,
  view: window,
}

const _mouse_common: Partial<MouseEventInit> = {
  ..._event_common,
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
}

export async function mouse_enter(el: Element): Promise<void> {
  const ev = new PointerEvent("mouseenter", {..._mouse_common, buttons: MouseButton.Left})
  el.dispatchEvent(ev)
}

export async function mouse_leave(el: Element): Promise<void> {
  const ev = new PointerEvent("mouseleave", {..._mouse_common, buttons: MouseButton.Left})
  el.dispatchEvent(ev)
}

export async function mouse_down(el: Element): Promise<void> {
  const ev = new PointerEvent("mousedown", {..._mouse_common, buttons: MouseButton.Left})
  el.dispatchEvent(ev)
}

export async function mouse_up(el: Element): Promise<void> {
  const ev = new PointerEvent("mouseup", {..._mouse_common, buttons: MouseButton.Left})
  el.dispatchEvent(ev)
}

export async function mouse_click(el: Element): Promise<void> {
  const ev = new PointerEvent("click", {..._mouse_common, buttons: MouseButton.Left})
  el.dispatchEvent(ev)
}

const _pointer_common: Partial<PointerEventInit> = {
  ..._event_common,
  isPrimary: true,
  pointerType: "mouse",
  pointerId: 1,
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
}

const MOVE_PRESSURE = 0.0
const HOLD_PRESSURE = 0.5

const DELTA = -120 // [px] one unit of scroll up; typical deltaY for deltaMode == DOM_DELTA_PIXEL (WheelEvent) in Chromium

export async function tap(el: Element): Promise<void> {
  const ev0 = new PointerEvent("pointerdown", {..._pointer_common, pressure: HOLD_PRESSURE, buttons: MouseButton.Left})
  el.dispatchEvent(ev0)

  const ev1 = new PointerEvent("pointerup", {..._pointer_common, pressure: HOLD_PRESSURE, buttons: MouseButton.Left})
  el.dispatchEvent(ev1)

  await delay(UIGestures.doubletap_threshold)
}

export async function press(el: Element): Promise<void> {
  const ev0 = new PointerEvent("pointerdown", {..._pointer_common, pressure: HOLD_PRESSURE, buttons: MouseButton.Left})
  el.dispatchEvent(ev0)

  await delay(UIGestures.press_threshold)

  const ev1 = new PointerEvent("pointerup", {..._pointer_common, pressure: HOLD_PRESSURE, buttons: MouseButton.Left})
  el.dispatchEvent(ev1)
}

export async function scroll(el: Element, delta: number): Promise<void> {
  const event = new WheelEvent("wheel", {
    ..._pointer_common,
    deltaX: 0,
    deltaY: delta,
    deltaZ: 0,
    deltaMode: WheelEvent.DOM_DELTA_PIXEL,
  })
  el.dispatchEvent(event)
}

export async function scroll_up(el: Element, count: number = 1): Promise<void> {
  assert(count >= 1)
  await scroll(el, count*(+DELTA))
}

export async function scroll_down(el: Element, count: number = 1): Promise<void> {
  assert(count >= 1)
  await scroll(el, count*(-DELTA))
}

type Line = {type: "line", xy0: Point, xy1: Point, n?: number}
type Poly = {type: "poly", xys: Point[], n?: number}
type Circle = {type: "circle", xy: Point, r: number, n?: number}

export function line(xy0: Point, xy1: Point, n?: number): Line {
  return {type: "line", xy0, xy1, n}
}

type Path = Line | Poly | Circle

type Units = "data" | "screen"

export type Options = {
  pause: number
  units: Units | {x?: Units, y?: Units}
}

type EventKeys = {
  shiftKey?: boolean
  ctrlKey?: boolean
  altKey?: boolean
}

export function actions(target: PlotView, options: Partial<Options> = {}): PlotActions {
  return new PlotActions(target, options)
}

export class PlotActions {
  readonly options: Options

  constructor(readonly target: PlotView, options: Partial<Options> = {}) {
    // The default pause between emitted events is longer than the
    // throttling threshold. This allows for predictable number of
    // paints and thus predictable and repeatable images.
    this.options = {pause: 20/*ms*/, units: "data", ...options}
  }

  protected get el(): Element {
    return this.target.canvas.events_el
  }

  async scroll(xy: Point, delta: number): Promise<void> {
    await this.emit(this._scroll(xy, delta))
  }

  async scroll_up(xy: Point, count: number = 1): Promise<void> {
    assert(count >= 1)
    await this.scroll(xy, count*(+DELTA))
  }

  async scroll_down(xy: Point, count: number = 1): Promise<void> {
    assert(count >= 1)
    await this.scroll(xy, count*(-DELTA))
  }

  async hover(xy0: Point, xy1?: Point, n?: number): Promise<void> {
    await this.emit(this._hover({type: "line", xy0, xy1: xy1 ?? xy0, n}))
  }

  async pan(xy0: Point, xy1: Point, n?: number): Promise<void> {
    await this.emit(this._pan({type: "line", xy0, xy1, n}))
  }

  async pan_along(path: Path, modifiers?: Partial<KeyModifiers>): Promise<void> {
    await this.emit(this._pan(path, this._event_keys(modifiers)))
  }

  async tap(xy: Point): Promise<void> {
    await this.emit(this._tap(xy))
    await delay(UIGestures.doubletap_threshold)
  }

  async double_tap(xy: Point): Promise<void> {
    await this.emit(this._double_tap(xy))
  }

  async press(xy: Point): Promise<void> {
    await this.emit(this._press(xy))
  }

  protected _event_keys(modifiers: Partial<KeyModifiers> = {}): EventKeys {
    return {
      shiftKey: modifiers.shift,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
    }
  }

  async emit(events: Iterable<UIEvent> | AsyncIterable<UIEvent>): Promise<void> {
    for await (const ev of events) {
      this.el.dispatchEvent(ev)
      await delay(this.options.pause)
    }
  }

  async *_emit(events: Iterable<UIEvent> | AsyncIterable<UIEvent>): AsyncGenerator<void> {
    for await (const ev of events) {
      this.el.dispatchEvent(ev)
      await delay(this.options.pause)
      yield
    }
  }

  protected screen({x, y}: Point): {clientX: number, clientY: number} {
    const {x_scale, y_scale} = this.target.frame
    const {x_screen, y_screen} = this.target.canvas.bbox
    const {left, top} = offset_bbox(this.el)
    const {units} = this.options
    const scale = (() => {
      if (isString(units)) {
        return {
          x: units == "data" ? x_scale : x_screen,
          y: units == "data" ? y_scale : y_screen,
        }
      } else {
        return {
          x: (units.x ?? "data") == "data" ? x_scale : x_screen,
          y: (units.y ?? "data") == "data" ? y_scale : y_screen,
        }
      }
    })()
    const sx = left + scale.x.compute(x)
    const sy = top + scale.y.compute(y)
    return {
      clientX: sx,
      clientY: sy,
    }
  }

  protected _bounds(path: Path): [Point, Point] {
    switch (path.type) {
      case "line": {
        const {xy0, xy1} = path
        return [xy0, xy1]
      }
      case "poly": {
        const {xys} = path
        return [xys[0], last(xys)]
      }
      case "circle": {
        const {xy: {x, y}, r} = path
        return [{x: x + r, y}, {x: x + r, y}]
      }
    }
  }

  protected *_compute(path: Path): Iterable<[number, number]> {
    const {n=10} = path
    switch (path.type) {
      case "line": {
        const {xy0, xy1} = path
        const xs = linspace(xy0.x, xy1.x, n)
        const ys = linspace(xy0.y, xy1.y, n)
        yield* zip(xs, ys)
        break
      }
      case "poly": {
        const {xys} = path
        let last = xys[0]
        const [, ..._xys] = xys
        for (const xy of _xys) {
          const xy0 = last
          const xy1 = xy
          yield* this._compute({type: "line", xy0, xy1, n})
          last = xy
        }
        break
      }
      case "circle": {
        const {xy: {x, y}, r} = path
        for (const t of linspace(0, 2*Math.PI, n)) {
          yield [x + Math.cos(t)*r, y + Math.sin(t)*r]
        }
        break
      }
    }
  }

  protected *_scroll({x, y}: Point, delta: number): Iterable<MouseEvent> {
    yield new WheelEvent("wheel", {
      ..._pointer_common,
      ...this.screen({x, y}),
      deltaX: 0,
      deltaY: delta,
      deltaZ: 0,
      deltaMode: WheelEvent.DOM_DELTA_PIXEL,
    })
  }

  protected *_move(path: Path, pressure: number, buttons: MouseButton, keys: EventKeys): Iterable<PointerEvent> {
    for (const [x, y] of this._compute(path)) {
      yield new PointerEvent("pointermove", {..._pointer_common, ...this.screen({x, y}), pressure, buttons, ...keys})
    }
  }

  protected *_hover(path: Path, keys: EventKeys = {}): Iterable<PointerEvent> {
    yield* this._move(path, MOVE_PRESSURE, MouseButton.None, keys)
  }

  *_pan(path: Path, keys: EventKeys = {}): Iterable<PointerEvent> {
    const [xy0, xy1] = this._bounds(path)
    yield new PointerEvent("pointerdown", {..._pointer_common, ...this.screen(xy0), pressure: HOLD_PRESSURE, ...keys, buttons: MouseButton.Left})
    yield* this._move(path, HOLD_PRESSURE, MouseButton.Left, keys)
    yield new PointerEvent("pointerup",   {..._pointer_common, ...this.screen(xy1), pressure: MOVE_PRESSURE, ...keys})
  }

  protected *_tap(xy: Point): Iterable<PointerEvent> {
    const sxy = this.screen(xy)
    yield new PointerEvent("pointerdown", {..._pointer_common, ...sxy, pressure: HOLD_PRESSURE, buttons: MouseButton.Left})
    yield new PointerEvent("pointerup",   {..._pointer_common, ...sxy, pressure: MOVE_PRESSURE})
  }

  protected *_double_tap(xy: Point): Iterable<PointerEvent> {
    yield* this._tap(xy)
    yield* this._tap(xy)
  }

  protected async *_press(xy: Point): AsyncIterable<PointerEvent> {
    const [pointerdown, pointerup] = this._tap(xy)
    yield pointerdown
    await delay(UIGestures.press_threshold)
    yield pointerup
  }
}
