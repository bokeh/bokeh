import type {PlotView} from "@bokehjs/models/plots/plot_canvas"
import {MouseButton, offset_bbox} from "@bokehjs/core/dom"
import {linspace, zip, last} from "@bokehjs/core/util/array"
import {delay} from "@bokehjs/core/util/defer"

export type Point = {x: number, y: number}

export function xy(x: number, y: number): Point {
  return {x, y}
}

const common: Partial<PointerEventInit> = {
  bubbles: true,
  composed: true,
  isPrimary: true,
  pointerType: "mouse",
  pointerId: 1,
  ctrlKey: false,
  shiftKey: false,
  view: window,
}

const MOVE_PRESSURE = 0.0
const HOLD_PRESSURE = 0.5

export async function click(el: Element): Promise<void> {
  const ev0 = new PointerEvent("pointerdown", {pressure: 0.5, buttons: MouseButton.Left, bubbles: true})
  el.dispatchEvent(ev0)

  await delay(10)

  const ev1 = new PointerEvent("pointerup", {bubbles: true})
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

type Path = Line | Poly | Circle

export type Options = {
  pause: number
  units: "data" | "screen"
}

export class PlotActions {
  readonly options: Options

  constructor(readonly target: PlotView, options: Partial<Options> = {}) {
    this.options = {pause: 5, units: "data", ...options}
  }

  protected get el(): Element {
    return this.target.canvas.events_el
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

  async pan_along(path: Path): Promise<void> {
    await this.emit(this._pan(path))
  }

  async tap(xy: Point): Promise<void> {
    await this.emit(this._tap(xy))
  }

  async double_tap(xy: Point): Promise<void> {
    await this.emit(this._double_tap(xy))
  }

  protected async emit(events: Iterable<UIEvent>): Promise<void> {
    for (const ev of events) {
      this.el.dispatchEvent(ev)
      await delay(this.options.pause)
    }
  }

  protected screen({x, y}: Point): {clientX: number, clientY: number} {
    const {x_scale, y_scale} = this.target.frame
    const {left, top} = offset_bbox(this.el)
    const {units} = this.options
    return {
      clientX: left + (units == "data" ? x_scale.compute(x) : x),
      clientY: top + (units == "data" ? y_scale.compute(y) : y),
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

  protected *_hover(path: Path): Iterable<MouseEvent> {
    for (const [x, y] of this._compute(path)) {
      yield new MouseEvent("mousemove", {...common, ...this.screen({x, y})})
    }
  }

  protected *_move(path: Path, pressure: number = MOVE_PRESSURE): Iterable<PointerEvent> {
    for (const [x, y] of this._compute(path)) {
      yield new PointerEvent("pointermove", {...common, ...this.screen({x, y}), pressure, buttons: MouseButton.Left})
    }
  }

  protected *_pan(path: Path): Iterable<PointerEvent> {
    const [xy0, xy1] = this._bounds(path)
    yield new PointerEvent("pointerdown", {...common, ...this.screen(xy0), pressure: HOLD_PRESSURE, buttons: MouseButton.Left})
    yield* this._move(path, HOLD_PRESSURE)
    yield new PointerEvent("pointerup",   {...common, ...this.screen(xy1), pressure: MOVE_PRESSURE})
  }

  protected *_tap(xy: Point): Iterable<PointerEvent> {
    const sxy = this.screen(xy)
    yield new PointerEvent("pointerdown", {...common, ...sxy, pressure: HOLD_PRESSURE, buttons: MouseButton.Left})
    yield new PointerEvent("pointerup",   {...common, ...sxy, pressure: MOVE_PRESSURE})
  }

  protected *_double_tap(xy: Point): Iterable<PointerEvent> {
    yield* this._tap(xy)
    yield* this._tap(xy)
  }
}
