import Hammer from "hammerjs"

import {Signal} from "./signaling"
import {logger} from "./logging"
import {offset_bbox, Keys} from "./dom"
import * as events from "./bokeh_events"
import {getDeltaY} from "./util/wheel"
import {reversed, is_empty} from "./util/array"
import {isObject} from "./util/types"
import {is_mobile} from "./util/platform"
import {PlotView} from "../models/plots/plot"
import {ToolView} from "../models/tools/tool"
import {RendererView} from "../models/renderers/renderer"
import type {CanvasView} from "../models/canvas/canvas"

export interface Moveable {
  _move_start(ev: MoveEvent): boolean
  _move(ev: MoveEvent): void
  _move_end(ev: MoveEvent): void
}

export interface Pannable {
  _pan_start(ev: PanEvent): boolean
  _pan(ev: PanEvent): void
  _pan_end(ev: PanEvent): void
}

export interface Pinchable {
  _pinch_start(ev: PinchEvent): boolean
  _pinch(ev: PinchEvent): void
  _pinch_end(ev: PinchEvent): void
}

export interface Rotatable {
  _rotate_start(ev: RotateEvent): boolean
  _rotate(ev: RotateEvent): void
  _rotate_end(ev: RotateEvent): void
}

export interface Scrollable {
  _scroll(ev: ScrollEvent): void
}

export interface Keyable {
  _keydown(ev: KeyEvent): void
  _keyup(ev: KeyEvent): void
}

export interface Tapable {
  _tap(ev: TapEvent): void
  _doubletap?(ev: TapEvent): void
  _press?(ev: TapEvent): void
  _pressup?(ev: TapEvent): void
}

export function is_Moveable(obj: unknown): obj is Moveable {
  return isObject(obj) && "_move_start" in obj && "_move" in obj && "_move_end" in obj
}

export function is_Pannable(obj: unknown): obj is Pannable {
  return isObject(obj) && "_pan_start" in obj && "_pan" in obj && "_pan_end" in obj
}

export function is_Pinchable(obj: unknown): obj is Pinchable {
  return isObject(obj) && "_pinch_start" in obj && "_pinch" in obj && "_pinch_end" in obj
}

export function is_Rotatable(obj: unknown): obj is Rotatable {
  return isObject(obj) && "_rotate_start" in obj && "_rotate" in obj && "_rotate_end" in obj
}

export function is_Scrollable(obj: unknown): obj is Scrollable {
  return isObject(obj) && "_scroll" in obj
}

export function is_Keyable(obj: unknown): obj is Keyable {
  return isObject(obj) && "_keydown" in obj && "_keyup" in obj
}

export function is_Tapable(obj: unknown): obj is Keyable {
  return isObject(obj) && "_tap" in obj
}

function is_touch(event: unknown): event is TouchEvent {
  return typeof TouchEvent !== "undefined" && event instanceof TouchEvent
}

type HammerEvent = {
  type: string
  deltaX: number
  deltaY: number
  scale: number
  rotation: number
  srcEvent: TouchEvent | MouseEvent | PointerEvent
}

export type ScreenCoord = {sx: number, sy: number}

export type KeyModifiers = {
  shift_key: boolean
  ctrl_key: boolean
  alt_key: boolean
}

export type PanEvent = {
  type: "pan" | "panstart" | "panend"
  sx: number
  sy: number
  dx: number
  dy: number
} & KeyModifiers

export type PinchEvent = {
  type: "pinch" | "pinchstart" | "pinchend"
  sx: number
  sy: number
  scale: number
} & KeyModifiers

export type RotateEvent = {
  type: "rotate" | "rotatestart" | "rotateend"
  sx: number
  sy: number
  rotation: number
} & KeyModifiers

export type GestureEvent = PanEvent | PinchEvent | RotateEvent

export type TapEvent = {
  type: "tap" | "doubletap" | "press" | "pressup" | "contextmenu"
  sx: number
  sy: number
} & KeyModifiers

export type MoveEvent = {
  type: "mousemove" | "mouseenter" | "mouseleave"
  sx: number
  sy: number
} & KeyModifiers

export type ScrollEvent = {
  type: "wheel"
  sx: number
  sy: number
  delta: number
} & KeyModifiers

export type UIEvent = GestureEvent | TapEvent | MoveEvent | ScrollEvent

export type KeyEvent = {
  type: "keyup" | "keydown"
  key: Keys
} & KeyModifiers

export type EventType = "pan" | "pinch" | "rotate" | "move" | "tap" | "doubletap" | "press" | "pressup" | "scroll"

export type UISignal<E> = Signal<{id: string | null, e: E}, UIEventBus>

export class UIEventBus implements EventListenerObject {
  readonly pan_start:    UISignal<PanEvent> = new Signal(this, "pan:start")
  readonly pan:          UISignal<PanEvent> = new Signal(this, "pan")
  readonly pan_end:      UISignal<PanEvent> = new Signal(this, "pan:end")

  readonly pinch_start:  UISignal<PinchEvent> = new Signal(this, "pinch:start")
  readonly pinch:        UISignal<PinchEvent> = new Signal(this, "pinch")
  readonly pinch_end:    UISignal<PinchEvent> = new Signal(this, "pinch:end")

  readonly rotate_start: UISignal<RotateEvent> = new Signal(this, "rotate:start")
  readonly rotate:       UISignal<RotateEvent> = new Signal(this, "rotate")
  readonly rotate_end:   UISignal<RotateEvent> = new Signal(this, "rotate:end")

  readonly tap:          UISignal<TapEvent>     = new Signal(this, "tap")
  readonly doubletap:    UISignal<TapEvent>     = new Signal(this, "doubletap")
  readonly press:        UISignal<TapEvent>     = new Signal(this, "press")
  readonly pressup:      UISignal<TapEvent>     = new Signal(this, "pressup")

  readonly move_enter:   UISignal<MoveEvent>    = new Signal(this, "move:enter")
  readonly move:         UISignal<MoveEvent>    = new Signal(this, "move")
  readonly move_exit:    UISignal<MoveEvent>    = new Signal(this, "move:exit")

  readonly scroll:       UISignal<ScrollEvent>  = new Signal(this, "scroll")

  readonly keydown:      UISignal<KeyEvent>     = new Signal(this, "keydown")
  readonly keyup:        UISignal<KeyEvent>     = new Signal(this, "keyup")

  private readonly hammer: HammerManager

  get hit_area(): HTMLElement {
    return this.canvas_view.events_el
  }

  constructor(readonly canvas_view: CanvasView) {
    this.hammer = new Hammer(this.hit_area, {
      cssProps: {} as any, // NOTE: don't assign style, use .bk-events instead
      touchAction: "auto",
      inputClass: !is_mobile ? Hammer.PointerEventInput : Hammer.TouchMouseInput, // https://github.com/bokeh/bokeh/issues/9187
    })

    this._configure_hammerjs()

    // Mouse & keyboard events not handled through hammerjs

    // We can 'add and forget' these event listeners because this.hit_area is a DOM element
    // that will be thrown away when the view is removed
    this.hit_area.addEventListener("mousemove", (e) => this._mouse_move(e))
    this.hit_area.addEventListener("mouseenter", (e) => this._mouse_enter(e))
    this.hit_area.addEventListener("mouseleave", (e) => this._mouse_exit(e))
    this.hit_area.addEventListener("contextmenu", (e) => this._context_menu(e))
    this.hit_area.addEventListener("wheel", (e) => this._mouse_wheel(e))

    // But we MUST remove listeners registered on document or we'll leak memory: register
    // 'this' as the listener (it implements the event listener interface, i.e. handleEvent)
    // instead of an anonymous function so we can easily refer back to it for removing
    document.addEventListener("keydown", this)
    document.addEventListener("keyup", this)
  }

  destroy(): void {
    this.hammer.destroy()
    document.removeEventListener("keydown", this)
    document.removeEventListener("keyup", this)
  }

  handleEvent(e: KeyboardEvent): void {
    if (e.type == "keydown")
      this._key_down(e)
    else if (e.type == "keyup")
      this._key_up(e)
  }

  protected _configure_hammerjs(): void {
    // This is to be able to distinguish double taps from single taps
    this.hammer.get("doubletap").recognizeWith("tap")
    this.hammer.get("tap").requireFailure("doubletap")
    this.hammer.get("doubletap").dropRequireFailure("tap")

    this.hammer.on("doubletap", (e) => this._doubletap(e))
    this.hammer.on("tap", (e) => this._tap(e))
    this.hammer.on("press", (e) => this._press(e))
    this.hammer.on("pressup", (e) => this._pressup(e))

    this.hammer.get("pan").set({direction: Hammer.DIRECTION_ALL})
    this.hammer.on("panstart", (e) => this._pan_start(e))
    this.hammer.on("pan", (e) => this._pan(e))
    this.hammer.on("panend", (e) => this._pan_end(e))

    this.hammer.get("pinch").set({enable: true})
    this.hammer.on("pinchstart", (e) => this._pinch_start(e))
    this.hammer.on("pinch", (e) => this._pinch(e))
    this.hammer.on("pinchend", (e) => this._pinch_end(e))

    this.hammer.get("rotate").set({enable: true})
    this.hammer.on("rotatestart", (e) => this._rotate_start(e))
    this.hammer.on("rotate", (e) => this._rotate(e))
    this.hammer.on("rotateend", (e) => this._rotate_end(e))
  }

  register_tool(tool_view: ToolView): void {
    let first = true
    for (const et of tool_view.model.event_types) {
      this._register_tool(tool_view, et, first)
      first = false
    }
  }

  private _register_tool(tool_view: ToolView, et: EventType, shared: boolean = true): void {
    const v = tool_view
    const {id} = v.model

    const conditionally = <T>(fn: (e: T) => void) => (arg: {id: string | null, e: T}): void => {
      if (arg.id == id) fn(arg.e)
    }

    const unconditionally = <T>(fn: (e: T) => void) => (arg: {id: string | null, e: T}): void => {
      fn(arg.e)
    }

    switch (et) {
      case "pan": {
        if (v._pan_start != null)    v.connect(this.pan_start,    conditionally(v._pan_start.bind(v)))
        if (v._pan != null)          v.connect(this.pan,          conditionally(v._pan.bind(v)))
        if (v._pan_end != null)      v.connect(this.pan_end,      conditionally(v._pan_end.bind(v)))
        break
      }
      case "pinch": {
        if (v._pinch_start != null)  v.connect(this.pinch_start,  conditionally(v._pinch_start.bind(v)))
        if (v._pinch != null)        v.connect(this.pinch,        conditionally(v._pinch.bind(v)))
        if (v._pinch_end != null)    v.connect(this.pinch_end,    conditionally(v._pinch_end.bind(v)))
        break
      }
      case "rotate": {
        if (v._rotate_start != null) v.connect(this.rotate_start, conditionally(v._rotate_start.bind(v)))
        if (v._rotate != null)       v.connect(this.rotate,       conditionally(v._rotate.bind(v)))
        if (v._rotate_end != null)   v.connect(this.rotate_end,   conditionally(v._rotate_end.bind(v)))
        break
      }
      case "move": {
        if (v._move_enter != null)   v.connect(this.move_enter,   conditionally(v._move_enter.bind(v)))
        if (v._move != null)         v.connect(this.move,         conditionally(v._move.bind(v)))
        if (v._move_exit != null)    v.connect(this.move_exit,    conditionally(v._move_exit.bind(v)))
        break
      }
      case "tap": {
        if (v._tap != null)          v.connect(this.tap,          conditionally(v._tap.bind(v)))
        // XXX: ultimately this shouldn't fall-throught, but breaking here would fail elsewhere
      }
      case "doubletap": {
        if (v._doubletap != null)    v.connect(this.doubletap,    conditionally(v._doubletap.bind(v)))
        break
      }
      case "press": {
        if (v._press != null)        v.connect(this.press,        conditionally(v._press.bind(v)))
        break
      }
      case "pressup": {
        if (v._pressup != null)      v.connect(this.pressup,      conditionally(v._pressup.bind(v)))
        break
      }
      case "scroll": {
        if (v._scroll != null)       v.connect(this.scroll,       conditionally(v._scroll.bind(v)))
        break
      }
    }

    // Skip shared events if registering multi-tool
    if (!shared)
      return

    if (v._keydown != null)
      v.connect(this.keydown, unconditionally(v._keydown.bind(v)))

    if (v._keyup != null)
      v.connect(this.keyup, unconditionally(v._keyup.bind(v)))

    // Dual touch hack part 1/2
    // This is a hack for laptops with touch screen who may be pinching or scrolling
    // in order to use the wheel zoom tool. If it's a touch screen the WheelZoomTool event
    // will be linked to pinch. But we also want to trigger in the case of a scroll.
    if (is_mobile && v._scroll != null && et == "pinch") {
      logger.debug("Registering scroll on touch screen")
      v.connect(this.scroll, conditionally(v._scroll.bind(v)))
    }
  }

  protected _hit_test_renderers(plot_view: PlotView, sx: number, sy: number): RendererView | null {
    const views = plot_view.get_renderer_views()

    for (const view of reversed(views)) {
      if (view.interactive_hit?.(sx, sy) ?? false)
        return view
    }

    return null
  }

  set_cursor(cursor: string = "default"): void {
    this.hit_area.style.cursor = cursor
  }

  protected _hit_test_frame(plot_view: PlotView, sx: number, sy: number): boolean {
    return plot_view.frame.bbox.contains(sx, sy)
  }

  protected _hit_test_plot(sx: number, sy: number): PlotView | null {
    // TODO: z-index
    for (const plot_view of this.canvas_view.plot_views) {
      if (plot_view.bbox.relative()/*XXX*/.contains(sx, sy))
        return plot_view
    }

    return null
  }

  protected _prev_move: {sx: number, sy: number, plot_view: PlotView | null} | null = null

  protected _curr_pan: {plot_view: PlotView} | null = null
  protected _curr_pinch: {plot_view: PlotView} | null = null
  protected _curr_rotate: {plot_view: PlotView} | null = null

  _trigger<E extends UIEvent>(signal: UISignal<E>, e: E, srcEvent: Event): void {
    if (!this.hit_area.isConnected)
      return

    const {sx, sy} = e
    const plot_view = this._hit_test_plot(sx, sy)
    const curr_view = plot_view

    const relativize_event = (_plot_view: PlotView): E => {
      const [rel_sx, rel_sy] = [sx, sy] // plot_view.layout.bbox.relativize(sx, sy)
      return {...e, sx: rel_sx, sy: rel_sy} as E
    }

    if (e.type == "panstart" || e.type == "pan" || e.type == "panend") {
      let pan_view: PlotView | null
      if (e.type == "panstart" && curr_view != null) {
        this._curr_pan = {plot_view: curr_view}
        pan_view = curr_view
      } else if (e.type == "pan" && this._curr_pan != null) {
        pan_view = this._curr_pan.plot_view
      } else if (e.type == "panend" && this._curr_pan != null) {
        pan_view = this._curr_pan.plot_view
        this._curr_pan = null
      } else {
        pan_view = null
      }

      if (pan_view != null) {
        const event = relativize_event(pan_view)
        this.__trigger(pan_view, signal, event, srcEvent)
      }
    } else if (e.type == "pinchstart" || e.type == "pinch" || e.type == "pinchend") {
      let pinch_view: PlotView | null
      if (e.type == "pinchstart" && curr_view != null) {
        this._curr_pinch = {plot_view: curr_view}
        pinch_view = curr_view
      } else if (e.type == "pinch" && this._curr_pinch != null) {
        pinch_view = this._curr_pinch.plot_view
      } else if (e.type == "pinchend" && this._curr_pinch != null) {
        pinch_view = this._curr_pinch.plot_view
        this._curr_pinch = null
      } else {
        pinch_view = null
      }

      if (pinch_view != null) {
        const event = relativize_event(pinch_view)
        this.__trigger(pinch_view, signal, event, srcEvent)
      }
    } else if (e.type == "rotatestart" || e.type == "rotate" || e.type == "rotateend") {
      let rotate_view: PlotView | null
      if (e.type == "rotatestart" && curr_view != null) {
        this._curr_rotate = {plot_view: curr_view}
        rotate_view = curr_view
      } else if (e.type == "rotate" && this._curr_rotate != null) {
        rotate_view = this._curr_rotate.plot_view
      } else if (e.type == "rotateend" && this._curr_rotate != null) {
        rotate_view = this._curr_rotate.plot_view
        this._curr_rotate = null
      } else {
        rotate_view = null
      }

      if (rotate_view != null) {
        const event = relativize_event(rotate_view)
        this.__trigger(rotate_view, signal, event, srcEvent)
      }
    } else if (e.type == "mouseenter" || e.type == "mousemove" || e.type == "mouseleave") {
      const prev_view = this._prev_move?.plot_view

      if (prev_view != null && (e.type == "mouseleave" || prev_view != curr_view)) {
        const {sx, sy} = relativize_event(prev_view)
        this.__trigger(prev_view, this.move_exit, {type: "mouseleave", sx, sy, shift_key: false, ctrl_key: false, alt_key: false}, srcEvent)
      }

      if (curr_view != null && (e.type == "mouseenter" || prev_view != curr_view)) {
        const {sx, sy} = relativize_event(curr_view)
        this.__trigger(curr_view, this.move_enter, {type: "mouseenter", sx, sy, shift_key: false, ctrl_key: false, alt_key: false}, srcEvent)
      }

      if (curr_view != null && e.type == "mousemove") {
        const event = relativize_event(curr_view)
        this.__trigger(curr_view, signal, event, srcEvent)
      }

      this._prev_move = {sx, sy, plot_view: curr_view}
    } else {
      if (curr_view != null) {
        const event = relativize_event(curr_view)
        this.__trigger(curr_view, signal, event, srcEvent)
      }
    }
  }

  private _current_pan_view: (RendererView & Pannable) | null = null
  private _current_pinch_view: (RendererView & Pinchable) | null = null
  private _current_rotate_view: (RendererView & Rotatable) | null = null
  private _current_move_view: (RendererView & Moveable) | null = null

  __trigger<E extends UIEvent>(plot_view: PlotView, signal: UISignal<E>, e: E, srcEvent: Event): void {
    const gestures = plot_view.model.toolbar.gestures
    type BaseType = keyof typeof gestures

    const event_type = signal.name
    const base_type = event_type.split(":")[0] as BaseType
    const view = this._hit_test_renderers(plot_view, e.sx, e.sy)

    if (base_type == "pan") {
      if (this._current_pan_view == null) {
        if (view != null) {
          if (event_type == "pan:start" && is_Pannable(view)) {
            if (view._pan_start(e as PanEvent)) {
              this._current_pan_view = view
              srcEvent.preventDefault()
              return
            }
          }
        }
      } else {
        if (event_type == "pan")
          this._current_pan_view._pan(e as PanEvent)
        else if (event_type == "pan:end") {
          this._current_pan_view._pan_end(e as PanEvent)
          this._current_pan_view = null
        }
        srcEvent.preventDefault()
        return
      }
    } else if (base_type == "pinch") {
      if (this._current_pinch_view == null) {
        if (view != null) {
          if (event_type == "pinch:start" && is_Pinchable(view)) {
            if (view._pinch_start(e as PinchEvent)) {
              this._current_pinch_view = view
              srcEvent.preventDefault()
              return
            }
          }
        }
      } else {
        if (event_type == "pinch")
          this._current_pinch_view._pinch(e as PinchEvent)
        else if (event_type == "pinch:end") {
          this._current_pinch_view._pinch_end(e as PinchEvent)
          this._current_pinch_view = null
        }
        srcEvent.preventDefault()
        return
      }
    } else if (base_type == "rotate") {
      if (this._current_rotate_view == null) {
        if (view != null) {
          if (event_type == "rotate:start" && is_Rotatable(view)) {
            if (view._rotate_start(e as RotateEvent)) {
              this._current_rotate_view = view
              srcEvent.preventDefault()
              return
            }
          }
        }
      } else {
        if (event_type == "rotate")
          this._current_rotate_view._rotate(e as RotateEvent)
        else if (event_type == "rotate:end") {
          this._current_rotate_view._rotate_end(e as RotateEvent)
          this._current_rotate_view = null
        }
        srcEvent.preventDefault()
        return
      }
    } else if (base_type == "move") {
      if (this._current_move_view == view) {
        this._current_move_view?._move(e as MoveEvent)
      } else {
        this._current_move_view?._move_end(e as MoveEvent)
        this._current_move_view = null

        if (view != null && is_Moveable(view)) {
          if (view._move_start(e as MoveEvent)) {
            this._current_move_view = view
          }
        }
      }
    }

    switch (base_type) {
      case "move": {
        const active_gesture = gestures.move.active
        if (active_gesture != null)
          this.trigger(signal, e, active_gesture.id)

        const active_inspectors = plot_view.model.toolbar.inspectors.filter(t => t.active)
        let cursor = "default"

        // the event happened on a renderer
        if (view != null) {
          cursor = view.cursor(e.sx, e.sy) ?? cursor

          if (!view.model.propagate_hover && !is_empty(active_inspectors)) {
            // override event_type to cause inspectors to clear overlays
            signal = this.move_exit as any // XXX
          }

        // the event happened on the plot frame but off a renderer
        } else if (this._hit_test_frame(plot_view, e.sx, e.sy)) {
          if (!is_empty(active_inspectors)) {
            cursor = "crosshair"
          }
        }

        this.set_cursor(cursor)

        active_inspectors.map((inspector) => this.trigger(signal, e, inspector.id))
        break
      }
      case "tap": {
        // XXX: hammerjs, why non-standard path?
        const path: EventTarget[] = (srcEvent as any).path ?? srcEvent.composedPath()
        if (path.length != 0 && path[0] != this.hit_area)
          return // don't trigger bokeh events

        view?.on_hit?.(e.sx, e.sy)

        if (this._hit_test_frame(plot_view, e.sx, e.sy)) {
          const active_gesture = gestures.tap.active
          if (active_gesture != null)
            this.trigger(signal, e, active_gesture.id)
        }
        break
      }
      case "doubletap": {
        if (this._hit_test_frame(plot_view, e.sx, e.sy)) {
          const active_gesture = gestures.doubletap.active ?? gestures.tap.active
          if (active_gesture != null)
            this.trigger(signal, e, active_gesture.id)
        }
        break
      }
      case "scroll": {
        // Dual touch hack part 2/2
        // This is a hack for laptops with touch screen who may be pinching or scrolling
        // in order to use the wheel zoom tool. If it's a touch screen the WheelZoomTool event
        // will be linked to pinch. But we also want to trigger in the case of a scroll.
        const base = is_mobile ? "pinch" : "scroll"
        const active_gesture = gestures[base].active
        if (active_gesture != null) {
          srcEvent.preventDefault()
          srcEvent.stopPropagation()
          this.trigger(signal, e, active_gesture.id)
        }
        break
      }
      case "pan": {
        const active_gesture = gestures.pan.active
        if (active_gesture != null) {
          srcEvent.preventDefault()
          this.trigger(signal, e, active_gesture.id)
        }
        break
      }
      default: {
        const active_gesture = gestures[base_type].active
        if (active_gesture != null)
          this.trigger(signal, e, active_gesture.id)
      }
    }

    this._trigger_bokeh_event(plot_view, e)
  }

  trigger<E>(signal: UISignal<E>, e: E, id: string | null = null): void {
    signal.emit({id, e})
  }

  /*protected*/ _trigger_bokeh_event(plot_view: PlotView, e: UIEvent): void {
    const ev = (() => {
      const {sx, sy} = e
      const x = plot_view.frame.x_scale.invert(sx)
      const y = plot_view.frame.y_scale.invert(sy)

      switch (e.type) {
        case "wheel":
          return new events.MouseWheel(sx, sy, x, y, e.delta)
        case "mousemove":
          return new events.MouseMove(sx, sy, x, y)
        case "mouseenter":
          return new events.MouseEnter(sx, sy, x, y)
        case "mouseleave":
          return new events.MouseLeave(sx, sy, x, y)
        case "tap":
          return new events.Tap(sx, sy, x, y)
        case "doubletap":
          return new events.DoubleTap(sx, sy, x, y)
        case "press":
          return new events.Press(sx, sy, x, y)
        case "pressup":
          return new events.PressUp(sx, sy, x, y)
        case "pan":
          return new events.Pan(sx, sy, x, y, e.dx, e.dy)
        case "panstart":
          return new events.PanStart(sx, sy, x, y)
        case "panend":
          return new events.PanEnd(sx, sy, x, y)
        case "pinch":
          return new events.Pinch(sx, sy, x, y, e.scale)
        case "pinchstart":
          return new events.PinchStart(sx, sy, x, y)
        case "pinchend":
          return new events.PinchEnd(sx, sy, x, y)
        case "rotate":
          return new events.Rotate(sx, sy, x, y, e.rotation)
        case "rotatestart":
          return new events.RotateStart(sx, sy, x, y)
        case "rotateend":
          return new events.RotateEnd(sx, sy, x, y)
        default:
          return undefined
      }
    })()

    if (ev != null)
      plot_view.model.trigger_event(ev)
  }

  /*private*/ _get_sxy(event: TouchEvent | MouseEvent | PointerEvent): ScreenCoord {
    const {pageX, pageY} = is_touch(event) ? (event.touches.length != 0 ? event.touches : event.changedTouches)[0] : event
    const {left, top} = offset_bbox(this.hit_area)
    return {
      sx: pageX - left,
      sy: pageY - top,
    }
  }

  /*private*/ _pan_event(e: HammerEvent): PanEvent {
    return {
      type: e.type as PanEvent["type"],
      ...this._get_sxy(e.srcEvent),
      dx: e.deltaX,
      dy: e.deltaY,
      shift_key: e.srcEvent.shiftKey,
      ctrl_key: e.srcEvent.ctrlKey,
      alt_key: e.srcEvent.altKey,
    }
  }

  /*private*/ _pinch_event(e: HammerEvent): PinchEvent {
    return {
      type: e.type as PinchEvent["type"],
      ...this._get_sxy(e.srcEvent),
      scale: e.scale,
      shift_key: e.srcEvent.shiftKey,
      ctrl_key: e.srcEvent.ctrlKey,
      alt_key: e.srcEvent.altKey,
    }
  }

  /*private*/ _rotate_event(e: HammerEvent): RotateEvent {
    return {
      type: e.type as RotateEvent["type"],
      ...this._get_sxy(e.srcEvent),
      rotation: e.rotation,
      shift_key: e.srcEvent.shiftKey,
      ctrl_key: e.srcEvent.ctrlKey,
      alt_key: e.srcEvent.altKey,
    }
  }

  /*private*/ _tap_event(e: HammerEvent): TapEvent {
    return {
      type: e.type as TapEvent["type"],
      ...this._get_sxy(e.srcEvent),
      shift_key: e.srcEvent.shiftKey,
      ctrl_key: e.srcEvent.ctrlKey,
      alt_key: e.srcEvent.altKey,
    }
  }

  /*private*/ _move_event(e: MouseEvent): MoveEvent {
    return {
      type: e.type as MoveEvent["type"],
      ...this._get_sxy(e),
      shift_key: e.shiftKey,
      ctrl_key: e.ctrlKey,
      alt_key: e.altKey,
    }
  }

  /*private*/ _scroll_event(e: WheelEvent): ScrollEvent {
    return {
      type: e.type as ScrollEvent["type"],
      ...this._get_sxy(e),
      delta: getDeltaY(e),
      shift_key: e.shiftKey,
      ctrl_key: e.ctrlKey,
      alt_key: e.altKey,
    }
  }

  /*private*/ _key_event(e: KeyboardEvent): KeyEvent {
    return {
      type: e.type as KeyEvent["type"],
      key: e.key as Keys,
      shift_key: e.shiftKey,
      ctrl_key: e.ctrlKey,
      alt_key: e.altKey,
    }
  }

  /*private*/ _pan_start(e: HammerEvent): void {
    const ev = this._pan_event(e)
    // back out delta to get original center point
    ev.sx -= e.deltaX
    ev.sy -= e.deltaY
    this._trigger(this.pan_start, ev, e.srcEvent)
  }

  /*private*/ _pan(e: HammerEvent): void {
    this._trigger(this.pan, this._pan_event(e), e.srcEvent)
  }

  /*private*/ _pan_end(e: HammerEvent): void {
    this._trigger(this.pan_end, this._pan_event(e), e.srcEvent)
  }

  /*private*/ _pinch_start(e: HammerEvent): void {
    this._trigger(this.pinch_start, this._pinch_event(e), e.srcEvent)
  }

  /*private*/ _pinch(e: HammerEvent): void {
    this._trigger(this.pinch, this._pinch_event(e), e.srcEvent)
  }

  /*private*/ _pinch_end(e: HammerEvent): void {
    this._trigger(this.pinch_end, this._pinch_event(e), e.srcEvent)
  }

  /*private*/ _rotate_start(e: HammerEvent): void {
    this._trigger(this.rotate_start, this._rotate_event(e), e.srcEvent)
  }

  /*private*/ _rotate(e: HammerEvent): void {
    this._trigger(this.rotate, this._rotate_event(e), e.srcEvent)
  }

  /*private*/ _rotate_end(e: HammerEvent): void {
    this._trigger(this.rotate_end, this._rotate_event(e), e.srcEvent)
  }

  /*private*/ _tap(e: HammerEvent): void {
    this._trigger(this.tap, this._tap_event(e), e.srcEvent)
  }

  /*private*/ _doubletap(e: HammerEvent): void {
    this._trigger(this.doubletap, this._tap_event(e), e.srcEvent)
  }

  /*private*/ _press(e: HammerEvent): void {
    this._trigger(this.press, this._tap_event(e), e.srcEvent)
  }

  /*private*/ _pressup(e: HammerEvent): void {
    this._trigger(this.pressup, this._tap_event(e), e.srcEvent)
  }

  /*private*/ _mouse_enter(e: MouseEvent): void {
    this._trigger(this.move_enter, this._move_event(e), e)
  }

  /*private*/ _mouse_move(e: MouseEvent): void {
    this._trigger(this.move, this._move_event(e), e)
  }

  /*private*/ _mouse_exit(e: MouseEvent): void {
    this._trigger(this.move_exit, this._move_event(e), e)
  }

  /*private*/ _mouse_wheel(e: WheelEvent): void {
    this._trigger(this.scroll, this._scroll_event(e), e)
  }

  /*private*/ _context_menu(_e: MouseEvent): void {
    // TODO
  }

  /*private*/ _key_down(e: KeyboardEvent): void {
    // NOTE: keyup event triggered unconditionally
    this.trigger(this.keydown, this._key_event(e))
  }

  /*private*/ _key_up(e: KeyboardEvent): void {
    // NOTE: keyup event triggered unconditionally
    this.trigger(this.keyup, this._key_event(e))
  }
}
