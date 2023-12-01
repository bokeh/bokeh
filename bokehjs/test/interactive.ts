import type {PlotView} from "@bokehjs/models/plots/plot_canvas"
import {MouseButton, offset_bbox} from "@bokehjs/core/dom"
import {linspace, zip, last} from "@bokehjs/core/util/array"
import {delay} from "@bokehjs/core/util/defer"
import type {KeyModifiers} from "@bokehjs/core/ui_events"

export type Point = {x: number, y: number}

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

export async function click(el: Element): Promise<void> {
  const ev0 = new PointerEvent("pointerdown", {..._pointer_common, pressure: HOLD_PRESSURE, buttons: MouseButton.Left})
  el.dispatchEvent(ev0)

  await delay(10)

  const ev1 = new PointerEvent("pointerup", {..._pointer_common, pressure: HOLD_PRESSURE, buttons: MouseButton.Left})
  el.dispatchEvent(ev1)
}

export async function press(el: Element): Promise<void> {
  const ev0 = new PointerEvent("pointerdown", {pressure: 0.5, buttons: MouseButton.Left, bubbles: true})
  el.dispatchEvent(ev0)

  await delay(250)

  const ev1 = new PointerEvent("pointerup", {bubbles: true})
  el.dispatchEvent(ev1)
}

type Line = {type: "line", xy0: Point, xy1: Point, n?: number}
type Poly = {type: "poly", xys: Point[], n?: number}
type Circle = {type: "circle", xy: Point, r: number, n?: number}

export function line(xy0: Point, xy1: Point, n?: number): Line {
  return {type: "line", xy0, xy1, n}
}

type Path = Line | Poly | Circle

export type Options = {
  pause: number
  units: "data" | "screen"
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

  async hover(xy0: Point, xy1?: Point, n?: number): Promise<void> {
    await this.emit(this._hover({type: "line", xy0, xy1: xy1 ?? xy0, n}))
  }

  async move(xy0: Point, xy1: Point, n?: number, pressure?: number): Promise<void> {
    await this.emit(this._move({type: "line", xy0, xy1, n}, pressure))
  }

  async pan(xy0: Point, xy1: Point, n?: number): Promise<void> {
    await this.emit(this._pan({type: "line", xy0, xy1, n}))
  }

  async pan_along(path: Path, modifiers?: Partial<KeyModifiers>): Promise<void> {
    await this.emit(this._pan(path, this._event_keys(modifiers)))
  }

  async tap(xy: Point): Promise<void> {
    await this.emit(this._tap(xy))
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

  protected async emit(events: Iterable<UIEvent> | AsyncIterable<UIEvent>): Promise<void> {
    for await (const ev of events) {
      this.el.dispatchEvent(ev)
      await delay(this.options.pause)
    }
  }

  protected screen({x, y}: Point): {clientX: number, clientY: number} {
    const {x_scale, y_scale} = this.target.frame
    const {left, top} = offset_bbox(this.el)
    const {units} = this.options
    const sx = left + (units == "data" ? x_scale.compute(x) : x)
    const sy = top + (units == "data" ? y_scale.compute(y) : y)
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

  protected *_hover(path: Path): Iterable<MouseEvent> {
    for (const [x, y] of this._compute(path)) {
      yield new MouseEvent("mousemove", {..._pointer_common, ...this.screen({x, y})})
    }
  }

  protected *_move(path: Path, pressure: number = MOVE_PRESSURE, keys: EventKeys = {}): Iterable<PointerEvent> {
    for (const [x, y] of this._compute(path)) {
      yield new PointerEvent("pointermove", {..._pointer_common, ...this.screen({x, y}), pressure, buttons: MouseButton.Left, ...keys})
    }
  }

  protected *_pan(path: Path, keys: EventKeys = {}): Iterable<PointerEvent> {
    const [xy0, xy1] = this._bounds(path)
    yield new PointerEvent("pointerdown", {..._pointer_common, ...this.screen(xy0), pressure: HOLD_PRESSURE, ...keys, buttons: MouseButton.Left})
    yield* this._move(path, HOLD_PRESSURE, keys)
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
    await delay(300)
    yield pointerup
  }
}
