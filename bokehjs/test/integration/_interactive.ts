import {PlotView} from "@bokehjs/models/plots/plot_canvas"
import {MouseButton, offset_bbox} from "@bokehjs/core/dom"
import {linspace, zip} from "@bokehjs/core/util/array"
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

export class PlotActions {
  constructor(readonly target: PlotView, readonly pause: number = 5) {}

  protected get el(): Element {
    return this.target.canvas.events_el

  }
  async hover(xy0: Point, xy1: Point, n?: number): Promise<void> {
    await this.emit(this._hover(xy0, xy1, n))
  }

  async move(xy0: Point, xy1: Point, n?: number, pressure?: number): Promise<void> {
    await this.emit(this._move(xy0, xy1, n, pressure))
  }

  async pan(xy0: Point, xy1: Point, n?: number): Promise<void> {
    await this.emit(this._pan(xy0, xy1, n))
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
      await delay(this.pause)
    }
  }

  protected screen({x, y}: Point): {clientX: number, clientY: number} {
    const {x_scale, y_scale} = this.target.frame
    const {left, top} = offset_bbox(this.el)
    return {
      clientX: left + x_scale.compute(x),
      clientY: top + y_scale.compute(y),
    }
  }

  protected *_hover(xy0: Point, xy1: Point, n: number = 5): Iterable<MouseEvent> {
    const xs = linspace(xy0.x, xy1.x, n)
    const ys = linspace(xy0.y, xy1.y, n)
    for (const [x, y] of zip(xs, ys)) {
      yield new MouseEvent("mousemove", {...common, ...this.screen({x, y})})
    }
  }

  protected *_move(xy0: Point, xy1: Point, n: number = 5, pressure: number = MOVE_PRESSURE): Iterable<PointerEvent> {
    const xs = linspace(xy0.x, xy1.x, n)
    const ys = linspace(xy0.y, xy1.y, n)
    for (const [x, y] of zip(xs, ys)) {
      yield new PointerEvent("pointermove", {...common, ...this.screen({x, y}), pressure, buttons: MouseButton.Left})
    }
  }

  protected *_pan(xy0: Point, xy1: Point, n: number = 5): Iterable<PointerEvent> {
    yield new PointerEvent("pointerdown", {...common, ...this.screen(xy0), pressure: HOLD_PRESSURE, buttons: MouseButton.Left})
    yield* this._move(xy0, xy1, n, HOLD_PRESSURE)
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
