import Hammer from "hammerjs"

import {Signal} from "./signaling"
import type {Keys} from "./dom"
import {offset_bbox} from "./dom"
import * as events from "./bokeh_events"
import {getDeltaY} from "./util/wheel"
import {reversed, is_empty} from "./util/array"
import {isObject} from "./util/types"
import {is_mobile} from "./util/platform"
import type {PlotView} from "../models/plots/plot"
import type {Tool, ToolView} from "../models/tools/tool"
import type {ToolLike} from "../models/tools/tool_proxy"
import {ToolProxy} from "../models/tools/tool_proxy"
import type {RendererView} from "../models/renderers/renderer"
import type {CanvasView} from "../models/canvas/canvas"

type NativeUIEvent = TouchEvent | MouseEvent | PointerEvent

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
  srcEvent: NativeUIEvent
}

export type ScreenCoord = {sx: number, sy: number}

export type KeyModifiers = {
  shift: boolean
  ctrl: boolean
  alt: boolean
}

export type PanEvent = {
  type: "pan" | "panstart" | "panend"
  sx: number
  sy: number
  dx: number
  dy: number
  modifiers: KeyModifiers
}

export type PinchEvent = {
  type: "pinch" | "pinchstart" | "pinchend"
  sx: number
  sy: number
  scale: number
  modifiers: KeyModifiers
}

export type RotateEvent = {
  type: "rotate" | "rotatestart" | "rotateend"
  sx: number
  sy: number
  rotation: number
  modifiers: KeyModifiers
}

export type GestureEvent = PanEvent | PinchEvent | RotateEvent

export type TapEvent = {
  type: "tap" | "doubletap" | "press" | "pressup" | "contextmenu"
  sx: number
  sy: number
  modifiers: KeyModifiers
}

export type MoveEvent = {
  type: "mousemove" | "mouseenter" | "mouseleave"
  sx: number
  sy: number
  modifiers: KeyModifiers
}

export type ScrollEvent = {
  type: "wheel"
  sx: number
  sy: number
  delta: number
  modifiers: KeyModifiers
}

export type UIEvent = GestureEvent | TapEvent | MoveEvent | ScrollEvent

export type KeyEvent = {
  type: "keyup" | "keydown"
  key: Keys
  modifiers: KeyModifiers
}

export type EventType = "pan" | "pinch" | "rotate" | "move" | "tap" | "doubletap" | "press" | "pressup" | "scroll"

export type UISignal<E> = Signal<{tool: ToolLike<Tool> | null, e: E}, UIEventBus>

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
      touchAction: "none", // TODO configure pan-x | pan-y | pinch-zoom
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
    this.hammer.on("tap", (e) => this._tap_or_doubletap(e))
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
    const {model: tool} = tool_view

    const handler = <T>(fn: (e: T) => void) => (arg: {tool: ToolLike<Tool> | null, e: T}): void => {
      if (arg.tool == null || arg.tool == tool) {
        fn.call(tool_view, arg.e)
      }
    }

    if (tool_view._pan_start != null) {
      tool_view.connect(this.pan_start,    handler(tool_view._pan_start))
    }
    if (tool_view._pan != null) {
      tool_view.connect(this.pan,          handler(tool_view._pan))
    }
    if (tool_view._pan_end != null) {
      tool_view.connect(this.pan_end,      handler(tool_view._pan_end))
    }

    if (tool_view._pinch_start != null) {
      tool_view.connect(this.pinch_start,  handler(tool_view._pinch_start))
    }
    if (tool_view._pinch != null) {
      tool_view.connect(this.pinch,        handler(tool_view._pinch))
    }
    if (tool_view._pinch_end != null) {
      tool_view.connect(this.pinch_end,    handler(tool_view._pinch_end))
    }

    if (tool_view._rotate_start != null) {
      tool_view.connect(this.rotate_start, handler(tool_view._rotate_start))
    }
    if (tool_view._rotate != null) {
      tool_view.connect(this.rotate,       handler(tool_view._rotate))
    }
    if (tool_view._rotate_end != null) {
      tool_view.connect(this.rotate_end,   handler(tool_view._rotate_end))
    }

    if (tool_view._move_enter != null) {
      tool_view.connect(this.move_enter,   handler(tool_view._move_enter))
    }
    if (tool_view._move != null) {
      tool_view.connect(this.move,         handler(tool_view._move))
    }
    if (tool_view._move_exit != null) {
      tool_view.connect(this.move_exit,    handler(tool_view._move_exit))
    }

    if (tool_view._tap != null) {
      tool_view.connect(this.tap,          handler(tool_view._tap))
    }
    if (tool_view._doubletap != null) {
      tool_view.connect(this.doubletap,    handler(tool_view._doubletap))
    }
    if (tool_view._press != null) {
      tool_view.connect(this.press,        handler(tool_view._press))
    }
    if (tool_view._pressup != null) {
      tool_view.connect(this.pressup,      handler(tool_view._pressup))
    }

    if (tool_view._scroll != null) {
      tool_view.connect(this.scroll,       handler(tool_view._scroll))
    }

    if (tool_view._keydown != null) {
      tool_view.connect(this.keydown,      handler(tool_view._keydown))
    }

    if (tool_view._keyup != null) {
      tool_view.connect(this.keyup,        handler(tool_view._keyup))
    }
  }

  hit_test_renderers(plot_view: PlotView, sx: number, sy: number): RendererView | null {
    const views = plot_view.get_renderer_views()

    for (const view of reversed(views)) {
      if (view.interactive_hit?.(sx, sy) ?? false)
        return view
    }

    return null
  }

  set_cursor(cursor?: string | null): void {
    this.hit_area.style.cursor = cursor ?? "default"
  }

  hit_test_frame(plot_view: PlotView, sx: number, sy: number): boolean {
    return plot_view.frame.bbox.contains(sx, sy)
  }

  hit_test_plot(sx: number, sy: number): PlotView | null {
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
    const plot_view = this.hit_test_plot(sx, sy)
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
        this.__trigger(prev_view, this.move_exit, {type: "mouseleave", sx, sy, modifiers: {shift: false, ctrl: false, alt: false}}, srcEvent)
      }

      if (curr_view != null && (e.type == "mouseenter" || prev_view != curr_view)) {
        const {sx, sy} = relativize_event(curr_view)
        this.__trigger(curr_view, this.move_enter, {type: "mouseenter", sx, sy, modifiers: {shift: false, ctrl: false, alt: false}}, srcEvent)
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
    const view = this.hit_test_renderers(plot_view, e.sx, e.sy)

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

    function get_tool_view(tool_like: ToolLike<Tool> | null): ToolView | null {
      if (tool_like != null) {
        const tool = tool_like instanceof ToolProxy ? tool_like.tools[0] : tool_like
        return plot_view.tool_views.get(tool) ?? null
      } else {
        return null
      }
    }

    switch (base_type) {
      case "move": {
        const active_gesture = gestures.move.active
        if (active_gesture != null) {
          this.trigger(signal, e, active_gesture)
        }

        const active_inspectors = plot_view.model.toolbar.inspectors.filter(t => t.active)

        const cursor = (() => {
          const current_view =
            this._current_pan_view ??
            this._current_pinch_view ??
            this._current_rotate_view ??
            this._current_move_view ??
            view ??
            get_tool_view(active_gesture)

          if (current_view != null) {
            const cursor = current_view.cursor(e.sx, e.sy)
            if (cursor != null) {
              return cursor
            }
          }

          if (this.hit_test_frame(plot_view, e.sx, e.sy) && !is_empty(active_inspectors)) {
            // the event happened on the plot frame but off a renderer
            return "crosshair"
          }

          return null
        })()
        this.set_cursor(cursor)

        if (view != null && !view.model.propagate_hover && !is_empty(active_inspectors)) {
          // override event_type to cause inspectors to clear overlays
          signal = this.move_exit as any // XXX
        }

        active_inspectors.map((inspector) => this.trigger(signal, e, inspector))
        break
      }
      case "tap": {
        // XXX: hammerjs, why non-standard path?
        const path: EventTarget[] = (srcEvent as any).path ?? srcEvent.composedPath()
        if (path.length != 0 && path[0] != this.hit_area)
          return // don't trigger bokeh events

        view?.on_hit?.(e.sx, e.sy)

        if (this.hit_test_frame(plot_view, e.sx, e.sy)) {
          const active_gesture = gestures.tap.active
          if (active_gesture != null)
            this.trigger(signal, e, active_gesture)
        }
        break
      }
      case "doubletap": {
        if (this.hit_test_frame(plot_view, e.sx, e.sy)) {
          const active_gesture = gestures.doubletap.active ?? gestures.tap.active
          if (active_gesture != null)
            this.trigger(signal, e, active_gesture)
        }
        break
      }
      case "pinch": {
        const active_gesture = gestures.pinch.active ?? gestures.scroll.active
        if (active_gesture != null) {
          srcEvent.preventDefault()
          srcEvent.stopPropagation()
          this.trigger(signal, e, active_gesture)
        }
        break
      }
      case "scroll": {
        const active_gesture = gestures.scroll.active
        if (active_gesture != null) {
          srcEvent.preventDefault()
          srcEvent.stopPropagation()
          this.trigger(signal, e, active_gesture)
        }
        break
      }
      case "pan": {
        const active_gesture = gestures.pan.active
        if (active_gesture != null) {
          srcEvent.preventDefault()
          srcEvent.stopPropagation()
          this.trigger(signal, e, active_gesture)
        }

        /* TODO this requires knowledge of the current interactive
                tool (similar to _current_pan_view, etc.)
        const active_pan_view = get_tool_view(active_gesture)
        if (active_pan_view != null) {
          const cursor = active_pan_view.cursor(e.sx, e.sy)
          this.set_cursor(cursor)
        }
        */
        break
      }
      default: {
        const active_gesture = gestures[base_type].active
        if (active_gesture != null)
          this.trigger(signal, e, active_gesture)
      }
    }

    this._trigger_bokeh_event(plot_view, e)
  }

  trigger<E>(signal: UISignal<E>, e: E, tool: ToolLike<Tool> | null = null): void {
    signal.emit({tool, e})
  }

  /*protected*/ _trigger_bokeh_event(plot_view: PlotView, e: UIEvent): void {
    const ev = (() => {
      const {sx, sy, modifiers} = e
      const x = plot_view.frame.x_scale.invert(sx)
      const y = plot_view.frame.y_scale.invert(sy)

      switch (e.type) {
        case "wheel":
          return new events.MouseWheel(sx, sy, x, y, e.delta, modifiers)
        case "mousemove":
          return new events.MouseMove(sx, sy, x, y, modifiers)
        case "mouseenter":
          return new events.MouseEnter(sx, sy, x, y, modifiers)
        case "mouseleave":
          return new events.MouseLeave(sx, sy, x, y, modifiers)
        case "tap":
          return new events.Tap(sx, sy, x, y, modifiers)
        case "doubletap":
          return new events.DoubleTap(sx, sy, x, y, modifiers)
        case "press":
          return new events.Press(sx, sy, x, y, modifiers)
        case "pressup":
          return new events.PressUp(sx, sy, x, y, modifiers)
        case "pan":
          return new events.Pan(sx, sy, x, y, e.dx, e.dy, modifiers)
        case "panstart":
          return new events.PanStart(sx, sy, x, y, modifiers)
        case "panend":
          return new events.PanEnd(sx, sy, x, y, modifiers)
        case "pinch":
          return new events.Pinch(sx, sy, x, y, e.scale, modifiers)
        case "pinchstart":
          return new events.PinchStart(sx, sy, x, y, modifiers)
        case "pinchend":
          return new events.PinchEnd(sx, sy, x, y, modifiers)
        case "rotate":
          return new events.Rotate(sx, sy, x, y, e.rotation, modifiers)
        case "rotatestart":
          return new events.RotateStart(sx, sy, x, y, modifiers)
        case "rotateend":
          return new events.RotateEnd(sx, sy, x, y, modifiers)
        default:
          return undefined
      }
    })()

    if (ev != null) {
      plot_view.model.trigger_event(ev)
    }
  }

  /*private*/ _get_sxy(event: NativeUIEvent): ScreenCoord {
    const {pageX, pageY} = is_touch(event) ? (event.touches.length != 0 ? event.touches : event.changedTouches)[0] : event
    const {left, top} = offset_bbox(this.hit_area)
    return {
      sx: pageX - left,
      sy: pageY - top,
    }
  }

  protected _get_modifiers(event: NativeUIEvent | KeyboardEvent): KeyModifiers {
    return {
      shift: event.shiftKey,
      ctrl: event.ctrlKey,
      alt: event.altKey,
    }
  }

  /*private*/ _pan_event(e: HammerEvent): PanEvent {
    return {
      type: e.type as PanEvent["type"],
      ...this._get_sxy(e.srcEvent),
      dx: e.deltaX,
      dy: e.deltaY,
      modifiers: this._get_modifiers(e.srcEvent),
    }
  }

  /*private*/ _pinch_event(e: HammerEvent): PinchEvent {
    return {
      type: e.type as PinchEvent["type"],
      ...this._get_sxy(e.srcEvent),
      scale: e.scale,
      modifiers: this._get_modifiers(e.srcEvent),
    }
  }

  /*private*/ _rotate_event(e: HammerEvent): RotateEvent {
    return {
      type: e.type as RotateEvent["type"],
      ...this._get_sxy(e.srcEvent),
      rotation: e.rotation,
      modifiers: this._get_modifiers(e.srcEvent),
    }
  }

  /*private*/ _tap_event(e: HammerEvent): TapEvent {
    return {
      type: e.type as TapEvent["type"],
      ...this._get_sxy(e.srcEvent),
      modifiers: this._get_modifiers(e.srcEvent),
    }
  }

  /*private*/ _move_event(e: MouseEvent): MoveEvent {
    return {
      type: e.type as MoveEvent["type"],
      ...this._get_sxy(e),
      modifiers: this._get_modifiers(e),
    }
  }

  /*private*/ _scroll_event(e: WheelEvent): ScrollEvent {
    return {
      type: e.type as ScrollEvent["type"],
      ...this._get_sxy(e),
      delta: getDeltaY(e),
      modifiers: this._get_modifiers(e),
    }
  }

  /*private*/ _key_event(e: KeyboardEvent): KeyEvent {
    return {
      type: e.type as KeyEvent["type"],
      key: e.key as Keys,
      modifiers: this._get_modifiers(e),
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

  private _tap_timer: number | null = null

  private _tap_or_doubletap(e: HammerEvent): void {
    if (this._tap_timer == null) {
      this._tap(e)
      this._tap_timer = setTimeout(() => this._tap_timer = null, 300 /*ms*/)
    } else {
      clearTimeout(this._tap_timer)
      this._tap_timer = null
      this._doubletap(e)
    }
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
