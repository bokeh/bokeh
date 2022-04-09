import Hammer from "hammerjs"

import {Signal} from "./signaling"
import {logger} from "./logging"
import {offset, Keys} from "./dom"
import * as events from "./bokeh_events"
import {getDeltaY} from "./util/wheel"
import {reversed, is_empty} from "./util/array"
import {isString, isObject} from "./util/types"
import {is_mobile} from "./util/platform"
import {PlotView} from "../models/plots/plot"
import {ToolView} from "../models/tools/tool"
import {RendererView} from "../models/renderers/renderer"
import type {CanvasView} from "../models/canvas/canvas"

export interface Moveable {
  on_move_start(ev: MoveEvent): boolean
  on_move(ev: MoveEvent): void
  on_move_end(ev: MoveEvent): void
}

export interface Pannable {
  on_pan_start(ev: PanEvent): boolean
  on_pan(ev: PanEvent): void
  on_pan_end(ev: PanEvent): void
}

export interface Pinchable {
  on_pinch_start(ev: PinchEvent): boolean
  on_pinch(ev: PinchEvent): void
  on_pinch_end(ev: PinchEvent): void
}

export interface Rotatable {
  on_rotate_start(ev: RotateEvent): boolean
  on_rotate(ev: RotateEvent): void
  on_rotate_end(ev: RotateEvent): void
}

export interface Scrollable {
  on_scroll(ev: ScrollEvent): void
}

export interface Keyable {
  on_keydown?(ev: KeyEvent): void
  on_keyup?(ev: KeyEvent): void
}

export interface Tapable {
  on_tap?(ev: TapEvent): boolean
  on_doubletap?(ev: TapEvent): boolean
  on_press?(ev: TapEvent): boolean
  on_pressup?(ev: TapEvent): boolean
  on_context_menu?(ev: TapEvent): boolean
}

export function is_Moveable(obj: unknown): obj is Moveable {
  return isObject(obj) && "on_move_start" in obj && "on_move" in obj && "on_move_end" in obj
}

export function is_Pannable(obj: unknown): obj is Pannable {
  return isObject(obj) && "on_pan_start" in obj && "on_pan" in obj && "on_pan_end" in obj
}

export function is_Pinchable(obj: unknown): obj is Pinchable {
  return isObject(obj) && "on_pinch_start" in obj && "on_pinch" in obj && "on_pinch_end" in obj
}

export function is_Rotatable(obj: unknown): obj is Rotatable {
  return isObject(obj) && "on_rotate_start" in obj && "on_rotate" in obj && "on_rotate_end" in obj
}

export function is_Scrollable(obj: unknown): obj is Scrollable {
  return isObject(obj) && "on_scroll" in obj
}

export function is_Keyable(obj: unknown): obj is Keyable {
  return isObject(obj) && ("on_keydown" in obj || "on_keyup" in obj)
}

export function is_Tapable(obj: unknown): obj is Tapable {
  return isObject(obj) && ("on_tap" in obj || "on_doubletap" in obj || "on_press" in obj || "on_pressup" in obj)
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

export type PanEvent = {
  type: "pan" | "panstart" | "panend"
  sx: number
  sy: number
  deltaX: number
  deltaY: number
  shiftKey: boolean
  ctrlKey: boolean
}

export type PinchEvent = {
  type: "pinch" | "pinchstart" | "pinchend"
  sx: number
  sy: number
  scale: number
  shiftKey: boolean
  ctrlKey: boolean
}

export type RotateEvent = {
  type: "rotate" | "rotatestart" | "rotateend"
  sx: number
  sy: number
  rotation: number
  shiftKey: boolean
  ctrlKey: boolean
}

export type GestureEvent = PanEvent | PinchEvent | RotateEvent

export type TapEvent = {
  type: "tap" | "doubletap" | "press" | "pressup" | "contextmenu"
  sx: number
  sy: number
  shiftKey: boolean
  ctrlKey: boolean
}

export type MoveEvent = {
  type: "mousemove" | "mouseenter" | "mouseleave"
  sx: number
  sy: number
  shiftKey: boolean
  ctrlKey: boolean
}

export type ScrollEvent = {
  type: "wheel"
  sx: number
  sy: number
  delta: number
  shiftKey: boolean
  ctrlKey: boolean
}

export type UIEvent = GestureEvent | TapEvent | MoveEvent | ScrollEvent

export type KeyEvent = {
  type: "keyup" | "keydown"
  keyCode: Keys
}

export type EventType = "pan" | "pinch" | "rotate" | "move" | "tap" | "press" | "pressup" | "scroll"

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
  readonly context_menu: UISignal<TapEvent>     = new Signal(this, "context_menu")

  readonly move_enter:   UISignal<MoveEvent>    = new Signal(this, "move:enter")
  readonly move:         UISignal<MoveEvent>    = new Signal(this, "move")
  readonly move_exit:    UISignal<MoveEvent>    = new Signal(this, "move:exit")

  readonly scroll:       UISignal<ScrollEvent>  = new Signal(this, "scroll")

  readonly keydown:      UISignal<KeyEvent>     = new Signal(this, "keydown")
  readonly keyup:        UISignal<KeyEvent>     = new Signal(this, "keyup")

  private readonly hammer = new Hammer(this.hit_area, {
    touchAction: "auto",
    inputClass: Hammer.TouchMouseInput, // https://github.com/bokeh/bokeh/issues/9187
  })

  get hit_area(): HTMLElement {
    return this.canvas_view.events_el
  }

  constructor(readonly canvas_view: CanvasView) {
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
    const et = tool_view.model.event_type

    if (et != null) {
      if (isString(et))
        this._register_tool(tool_view, et)
      else {
        // Multi-tools should only registered shared events once
        et.forEach((e, index) => this._register_tool(tool_view, e, index < 1))
      }
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
        if (v._doubletap != null)    v.connect(this.doubletap,    conditionally(v._doubletap.bind(v)))
        break
      }
      case "press": {
        if (v._press != null)        v.connect(this.press,        conditionally(v._press.bind(v)))
        if (v._pressup != null)      v.connect(this.pressup,      conditionally(v._pressup.bind(v)))
        break
      }
      case "scroll": {
        if (v._scroll != null)       v.connect(this.scroll,       conditionally(v._scroll.bind(v)))
        break
      }
      default:
        throw new Error(`unsupported event_type: ${et}`)
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

  set_cursor(cursor: string = "default"): void {
    this.hit_area.style.cursor = cursor
  }

  protected _hit_test(sx: number, sy: number): RendererView | null {
    const cviews = this.canvas_view.renderer_views.values()
    for (const view of reversed([...cviews])) {
      if (view.interactive_hit?.(sx, sy) ?? false)
        return view
    }

    const plot_view = this.canvas_view.plot_views.find((pv) => pv.bbox.contains(sx, sy))

    if (plot_view != null) {
      const pviews = plot_view.get_renderer_views()

      for (const view of reversed(pviews)) {
        if (view.interactive_hit?.(sx, sy) ?? false)
          return view
      }
    }

    return null
  }

  protected _hit_test_frame(plot_view: PlotView, sx: number, sy: number): boolean {
    return plot_view.frame.bbox.contains(sx, sy)
  }

  protected _hit_test_plot(sx: number, sy: number): PlotView | null {
    return this.canvas_view.plot_views.find((pv) => pv.bbox.contains(sx, sy)) ?? null
  }

  protected _prev_move: {sx: number, sy: number, plot_view: PlotView | null} | null = null

  protected _curr_pan: {plot_view: PlotView} | null = null
  protected _curr_pinch: {plot_view: PlotView} | null = null
  protected _curr_rotate: {plot_view: PlotView} | null = null

  private _current_pan_view: (RendererView & Pannable) | null = null
  private _current_pinch_view: (RendererView & Pinchable) | null = null
  private _current_rotate_view: (RendererView & Rotatable) | null = null
  private _current_move_view: (RendererView & Moveable) | null = null

  _trigger<E extends UIEvent>(signal: UISignal<E>, e: E, src_event: Event): void {
    const view = this._hit_test(e.sx, e.sy)

    switch (e.type) {
      case "panstart":
      case "pan":
      case "panend": {
        if (this._current_pan_view == null) {
          if (view != null) {
            if (e.type == "panstart" && is_Pannable(view)) {
              if (view.on_pan_start(e)) {
                this._current_pan_view = view
                src_event.preventDefault()
                return
              }
            }
          }
        } else {
          if (e.type == "pan")
            this._current_pan_view.on_pan(e)
          else if (e.type == "panend") {
            this._current_pan_view.on_pan_end(e)
            this._current_pan_view = null
          }
          src_event.preventDefault()
          return
        }
        break
      }
      case "pinchstart":
      case "pinch":
      case "pinchend": {
        if (this._current_pinch_view == null) {
          if (view != null) {
            if (e.type == "pinchstart" && is_Pinchable(view)) {
              if (view.on_pinch_start(e)) {
                this._current_pinch_view = view
                src_event.preventDefault()
                return
              }
            }
          }
        } else {
          if (e.type == "pinch")
            this._current_pinch_view.on_pinch(e)
          else if (e.type == "pinchend") {
            this._current_pinch_view.on_pinch_end(e)
            this._current_pinch_view = null
          }
          src_event.preventDefault()
          return
        }
        break
      }
      case "rotatestart":
      case "rotate":
      case "rotateend": {
        if (this._current_rotate_view == null) {
          if (view != null) {
            if (e.type == "rotatestart" && is_Rotatable(view)) {
              if (view.on_rotate_start(e)) {
                this._current_rotate_view = view
                src_event.preventDefault()
                return
              }
            }
          }
        } else {
          if (e.type == "rotate")
            this._current_rotate_view.on_rotate(e)
          else if (e.type == "rotateend") {
            this._current_rotate_view.on_rotate_end(e)
            this._current_rotate_view = null
          }
          src_event.preventDefault()
          return
        }
        break
      }
      case "mouseenter":
      case "mousemove":
      case "mouseleave": {
        const cursor = (() => {
          const target = view ?? this._hit_test_plot(e.sx, e.sy)
          return target?.cursor(e.sx, e.sy) ?? undefined
        })()
        this.set_cursor(cursor)

        if (this._current_move_view == view) {
          this._current_move_view?.on_move(e)
        } else {
          this._current_move_view?.on_move_end(e)
          this._current_move_view = null

          if (view != null && is_Moveable(view)) {
            if (view.on_move_start(e)) {
              this._current_move_view = view
            }
          }
        }
        break
      }
      case "wheel": {
        if (view != null && is_Scrollable(view)) {
          view.on_scroll(e)
        }
        break
      }
      case "tap":
      case "doubletap":
      case "press":
      case "pressup":
      case "contextmenu": {
        if (view != null && is_Tapable(view)) {
          let stop: boolean = false
          stop ||= view.on_tap?.(e) ?? false
          stop ||= view.on_doubletap?.(e) ?? false
          stop ||= view.on_press?.(e) ?? false
          stop ||= view.on_pressup?.(e) ?? false
          stop ||= view.on_context_menu?.(e) ?? false
          if (stop)
            return
        }
        break
      }
      /*
      case "keyup":
      case "keydown": {
        if (view != null && is_Tapable(view)) {
          view.on_tap?.(e)
          view.on_doubletap?.(e)
          view.on_press?.(e)
          view.on_pressup?.(e)
        }
        break
      }
      */
    }

    const event = e
    const {sx, sy} = e
    const plot_view = this._hit_test_plot(sx, sy)
    const curr_view = plot_view

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
        this.__trigger(pan_view, view, signal, event, src_event)
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
        this.__trigger(pinch_view, view, signal, event, src_event)
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
        this.__trigger(rotate_view, view, signal, event, src_event)
      }
    } else if (e.type == "mouseenter" || e.type == "mousemove" || e.type == "mouseleave") {
      const prev_view = this._prev_move?.plot_view

      if (prev_view != null && (e.type == "mouseleave" || prev_view != curr_view)) {
        this.__trigger(prev_view, view, this.move_exit, {type: "mouseleave", sx, sy, shiftKey: false, ctrlKey: false}, src_event)
      }

      if (curr_view != null && (e.type == "mouseenter" || prev_view != curr_view)) {
        this.__trigger(curr_view, view, this.move_enter, {type: "mouseenter", sx, sy, shiftKey: false, ctrlKey: false}, src_event)
      }

      if (curr_view != null && e.type == "mousemove") {
        this.__trigger(curr_view, view, signal, event, src_event)
      }

      this._prev_move = {sx, sy, plot_view: curr_view}
    } else {
      if (curr_view != null) {
        this.__trigger(curr_view, view, signal, event, src_event)
      }
    }
  }

  __trigger<E extends UIEvent>(plot_view: PlotView, view: RendererView | null, signal: UISignal<E>, e: E, srcEvent: Event): void {
    const gestures = plot_view.model.toolbar.gestures
    type BaseType = keyof typeof gestures

    const event_type = signal.name
    const base_type = event_type.split(":")[0] as BaseType

    switch (base_type) {
      case "move": {
        const active_gesture = gestures.move.active
        if (active_gesture != null)
          this.trigger(signal, e, active_gesture.id)

        const active_inspectors = plot_view.model.toolbar.inspectors.filter(t => t.active)

        // the event happened on a renderer
        if (view != null) {
          if (!is_empty(active_inspectors)) {
            // override event_type to cause inspectors to clear overlays
            signal = this.move_exit as any // XXX
          }
        }

        active_inspectors.map((inspector) => this.trigger(signal, e, inspector.id))
        break
      }
      case "tap": {
        // XXX: hammerjs, why non-standard path?
        const path: EventTarget[] = (srcEvent as any).path ?? srcEvent.composedPath()
        if (path.length != 0 && path[0] != this.hit_area)
          return // don't trigger bokeh events

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
          return new events.Pan(sx, sy, x, y, e.deltaX, e.deltaY)
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
    const {left, top} = offset(this.hit_area)
    return {
      sx: pageX - left,
      sy: pageY - top,
    }
  }

  /*private*/ _pan_event(e: HammerEvent): PanEvent {
    return {
      type: e.type as PanEvent["type"],
      ...this._get_sxy(e.srcEvent),
      deltaX: e.deltaX,
      deltaY: e.deltaY,
      shiftKey: e.srcEvent.shiftKey,
      ctrlKey: e.srcEvent.ctrlKey,
    }
  }

  /*private*/ _pinch_event(e: HammerEvent): PinchEvent {
    return {
      type: e.type as PinchEvent["type"],
      ...this._get_sxy(e.srcEvent),
      scale: e.scale,
      shiftKey: e.srcEvent.shiftKey,
      ctrlKey: e.srcEvent.ctrlKey,
    }
  }

  /*private*/ _rotate_event(e: HammerEvent): RotateEvent {
    return {
      type: e.type as RotateEvent["type"],
      ...this._get_sxy(e.srcEvent),
      rotation: e.rotation,
      shiftKey: e.srcEvent.shiftKey,
      ctrlKey: e.srcEvent.ctrlKey,
    }
  }

  /*private*/ _tap_event(e: HammerEvent): TapEvent {
    return {
      type: e.type as TapEvent["type"],
      ...this._get_sxy(e.srcEvent),
      shiftKey: e.srcEvent.shiftKey,
      ctrlKey: e.srcEvent.ctrlKey,
    }
  }

  /*private*/ _move_event(e: MouseEvent): MoveEvent {
    return {
      type: e.type as MoveEvent["type"],
      ...this._get_sxy(e),
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
    }
  }

  /*private*/ _scroll_event(e: WheelEvent): ScrollEvent {
    return {
      type: e.type as ScrollEvent["type"],
      ...this._get_sxy(e),
      delta: getDeltaY(e),
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
    }
  }

  /*private*/ _key_event(e: KeyboardEvent): KeyEvent {
    return {
      type: e.type as KeyEvent["type"],
      keyCode: e.keyCode,
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

  /*private*/ _context_menu(e: MouseEvent): void {
    this._trigger(this.context_menu, {...this._move_event(e), type: "contextmenu"}, e)
  }

  /*private*/ _mouse_wheel(e: WheelEvent): void {
    this._trigger(this.scroll, this._scroll_event(e), e)
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
