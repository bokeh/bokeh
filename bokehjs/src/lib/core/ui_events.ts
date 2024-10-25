import {UIGestures} from "./ui_gestures"
import {Signal} from "./signaling"
import type {Keys} from "./dom"
import {offset_bbox} from "./dom"
import * as events from "./bokeh_events"
import type {ViewStorage} from "./build_views"
import {getDeltaY} from "./util/wheel"
import {reversed, is_empty} from "./util/array"
import {isObject, isBoolean} from "./util/types"
import type {PlotView} from "../models/plots/plot"
import type {Tool, ToolView} from "../models/tools/tool"
import type {ToolLike} from "../models/tools/tool_proxy"
import {ToolProxy} from "../models/tools/tool_proxy"
import type {RendererView} from "../models/renderers/renderer"
import type {CanvasView} from "../models/canvas/canvas"

import type {TapEvent, PanEvent, PinchEvent, RotateEvent, MoveEvent, KeyModifiers} from "./ui_gestures"
export type {TapEvent, PanEvent, PinchEvent, RotateEvent, MoveEvent, KeyModifiers} from "./ui_gestures"

export interface Tapable {
  on_tap(event: TapEvent): void
  on_doubletap?(event: TapEvent): void
  on_press?(event: TapEvent): void
  on_pressup?(event: TapEvent): void
}

export interface Moveable {
  on_enter(event: MoveEvent): boolean
  on_move(event: MoveEvent): void
  on_leave(event: MoveEvent): void
}

export interface Pannable {
  on_pan_start(event: PanEvent): boolean
  on_pan(event: PanEvent): void
  on_pan_end(event: PanEvent): void
}

export interface Pinchable {
  on_pinch_start(event: PinchEvent): boolean
  on_pinch(event: PinchEvent): void
  on_pinch_end(event: PinchEvent): void
}

export interface Rotatable {
  on_rotate_start(event: RotateEvent): boolean
  on_rotate(event: RotateEvent): void
  on_rotate_end(event: RotateEvent): void
}

export interface Scrollable {
  on_scroll(event: ScrollEvent): void
}

export interface Keyable {
  on_keydown(event: KeyEvent): void
  on_keyup(event: KeyEvent): void
}

export function is_Tapable(obj: unknown): obj is Keyable {
  return isObject(obj) && "on_tap" in obj
}

export function is_Moveable(obj: unknown): obj is Moveable {
  return isObject(obj) && "on_enter" in obj && "on_move" in obj && "on_leave" in obj
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
  return isObject(obj) && "on_keydown" in obj && "on_keyup" in obj
}

export type GestureEvent = PanEvent | PinchEvent | RotateEvent

export type ScrollEvent = {
  type: "wheel"
  sx: number
  sy: number
  delta: number
  modifiers: KeyModifiers
  native: WheelEvent
}

export type UIEvent = GestureEvent | TapEvent | MoveEvent | ScrollEvent

export type KeyEvent = {
  type: "keyup" | "keydown"
  key: Keys
  modifiers: KeyModifiers
  native: KeyboardEvent
}

export type EventType = "pan" | "pinch" | "rotate" | "move" | "tap" | "doubletap" | "press" | "pressup" | "scroll"

export type UISignal<E> = Signal<{tool: ToolLike<Tool> | null, e: E}, UIEventBus>

export class UIEventBus {
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

  readonly hit_area: HTMLElement
  readonly ui_gestures: UIGestures

  constructor(readonly canvas_view: CanvasView) {
    this.hit_area = canvas_view.events_el

    this.on_tap = this.on_tap.bind(this)
    this.on_doubletap = this.on_doubletap.bind(this)
    this.on_press = this.on_press.bind(this)
    this.on_pressup = this.on_pressup.bind(this)

    this.on_enter = this.on_enter.bind(this)
    this.on_move = this.on_move.bind(this)
    this.on_leave = this.on_leave.bind(this)

    this.on_pan_start = this.on_pan_start.bind(this)
    this.on_pan = this.on_pan.bind(this)
    this.on_pan_end = this.on_pan_end.bind(this)

    this.on_pinch_start = this.on_pinch_start.bind(this)
    this.on_pinch = this.on_pinch.bind(this)
    this.on_pinch_end = this.on_pinch_end.bind(this)

    this.on_rotate_start = this.on_rotate_start.bind(this)
    this.on_rotate = this.on_rotate.bind(this)
    this.on_rotate_end = this.on_rotate_end.bind(this)

    this.ui_gestures = new UIGestures(this.hit_area, this, {must_be_target: true})
    this.ui_gestures.connect_signals()

    this.on_context_menu = this.on_context_menu.bind(this)
    this.on_mouse_wheel = this.on_mouse_wheel.bind(this)

    this.on_key_down = this.on_key_down.bind(this)
    this.on_key_up = this.on_key_up.bind(this)

    this.hit_area.addEventListener("contextmenu", this.on_context_menu)
    this.hit_area.addEventListener("wheel", this.on_mouse_wheel)

    document.addEventListener("keydown", this.on_key_down)
    document.addEventListener("keyup", this.on_key_up)
  }

  remove(): void {
    this.ui_gestures.remove()

    this.hit_area.removeEventListener("contextmenu", this.on_context_menu)
    this.hit_area.removeEventListener("wheel", this.on_mouse_wheel)

    document.removeEventListener("keydown", this.on_key_down)
    document.removeEventListener("keyup", this.on_key_up)
  }

  protected readonly _tools: ViewStorage<ToolLike<Tool>> = new Map()

  register_tool(tool_view: ToolView): void {
    const {model: tool} = tool_view

    if (this._tools.has(tool)) {
      throw new Error(`${tool} already registered`)
    } else {
      this._tools.set(tool, tool_view)
    }
  }

  hit_test_renderers(plot_view: PlotView, sx: number, sy: number): RendererView[] {
    const collected = []
    for (const view of reversed(plot_view.all_renderer_views)) {
      if (view.interactive_hit?.(sx, sy) ?? false) {
        collected.push(view)
      }
    }
    return collected
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
      if (plot_view.bbox.relative()/*XXX*/.contains(sx, sy)) {
        return plot_view
      }
    }

    return null
  }

  protected _prev_move: {sx: number, sy: number, plot_view: PlotView | null} | null = null

  protected _curr_pan: {plot_view: PlotView} | null = null
  protected _curr_pinch: {plot_view: PlotView} | null = null
  protected _curr_rotate: {plot_view: PlotView} | null = null

  _trigger<E extends UIEvent>(signal: UISignal<E>, e: E): void {
    if (!this.hit_area.isConnected) {
      return
    }

    const {sx, sy, native: srcEvent} = e
    const plot_view = this.hit_test_plot(sx, sy)
    const curr_view = plot_view

    const relativize_event = (_plot_view: PlotView): E => {
      const [rel_sx, rel_sy] = [sx, sy] // plot_view.layout.bbox.relativize(sx, sy)
      return {...e, sx: rel_sx, sy: rel_sy} as E
    }

    if (e.type == "pan_start" || e.type == "pan" || e.type == "pan_end") {
      let pan_view: PlotView | null
      if (e.type == "pan_start" && curr_view != null) {
        this._curr_pan = {plot_view: curr_view}
        pan_view = curr_view
      } else if (e.type == "pan" && this._curr_pan != null) {
        pan_view = this._curr_pan.plot_view
      } else if (e.type == "pan_end" && this._curr_pan != null) {
        pan_view = this._curr_pan.plot_view
        this._curr_pan = null
      } else {
        pan_view = null
      }

      if (pan_view != null) {
        const event = relativize_event(pan_view)
        this.__trigger(pan_view, signal, event, srcEvent)
      }
    } else if (e.type == "pinch_start" || e.type == "pinch" || e.type == "pinch_end") {
      let pinch_view: PlotView | null
      if (e.type == "pinch_start" && curr_view != null) {
        this._curr_pinch = {plot_view: curr_view}
        pinch_view = curr_view
      } else if (e.type == "pinch" && this._curr_pinch != null) {
        pinch_view = this._curr_pinch.plot_view
      } else if (e.type == "pinch_end" && this._curr_pinch != null) {
        pinch_view = this._curr_pinch.plot_view
        this._curr_pinch = null
      } else {
        pinch_view = null
      }

      if (pinch_view != null) {
        const event = relativize_event(pinch_view)
        this.__trigger(pinch_view, signal, event, srcEvent)
      }
    } else if (e.type == "rotate_start" || e.type == "rotate" || e.type == "rotate_end") {
      let rotate_view: PlotView | null
      if (e.type == "rotate_start" && curr_view != null) {
        this._curr_rotate = {plot_view: curr_view}
        rotate_view = curr_view
      } else if (e.type == "rotate" && this._curr_rotate != null) {
        rotate_view = this._curr_rotate.plot_view
      } else if (e.type == "rotate_end" && this._curr_rotate != null) {
        rotate_view = this._curr_rotate.plot_view
        this._curr_rotate = null
      } else {
        rotate_view = null
      }

      if (rotate_view != null) {
        const event = relativize_event(rotate_view)
        this.__trigger(rotate_view, signal, event, srcEvent)
      }
    } else if (e.type == "enter" || e.type == "move" || e.type == "leave") {
      const prev_view = this._prev_move?.plot_view

      if (prev_view != null && (e.type == "leave" || prev_view != curr_view)) {
        const {sx, sy} = relativize_event(prev_view)
        this.__trigger(prev_view, this.move_exit, {type: "leave", sx, sy, modifiers: {shift: false, ctrl: false, alt: false}, native: srcEvent as PointerEvent}, srcEvent)
      }

      if (curr_view != null && (e.type == "enter" || prev_view != curr_view)) {
        const {sx, sy} = relativize_event(curr_view)
        this.__trigger(curr_view, this.move_enter, {type: "enter", sx, sy, modifiers: {shift: false, ctrl: false, alt: false}, native: srcEvent as PointerEvent}, srcEvent)
      }

      if (curr_view != null && e.type == "move") {
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

  private _current_interactive_tool_view: ToolView | null = null

  private _current_pan_view: (RendererView & Pannable) | null = null
  private _current_pinch_view: (RendererView & Pinchable) | null = null
  private _current_rotate_view: (RendererView & Rotatable) | null = null
  private _current_move_views: (RendererView & Moveable)[] = []

  __trigger<E extends UIEvent>(plot_view: PlotView, signal: UISignal<E>, e: E, srcEvent: Event): void {
    const gestures = plot_view.model.toolbar.gestures
    type BaseType = keyof typeof gestures

    const event_type = signal.name
    const base_type = event_type.split(":")[0] as BaseType
    const views = this.hit_test_renderers(plot_view, e.sx, e.sy)

    if (base_type == "pan") {
      const event = e as PanEvent
      if (this._current_pan_view == null) {
        if (event_type == "pan:start") {
          for (const view of views) {
            if (!is_Pannable(view)) {
              continue
            }
            if (view.on_pan_start(event)) {
              this._current_pan_view = view
              srcEvent.preventDefault()
              return
            }
          }
        }
      } else {
        if (event_type == "pan") {
          this._current_pan_view.on_pan(event)
        } else if (event_type == "pan:end") {
          this._current_pan_view.on_pan_end(event)
          this._current_pan_view = null
        }
        srcEvent.preventDefault()
        return
      }
    } else if (base_type == "pinch") {
      const event = e as PinchEvent
      if (this._current_pinch_view == null) {
        if (event_type == "pinch:start") {
          for (const view of views) {
            if (!is_Pinchable(view)) {
              continue
            }
            if (view.on_pinch_start(event)) {
              this._current_pinch_view = view
              srcEvent.preventDefault()
              return
            }
          }
        }
      } else {
        if (event_type == "pinch") {
          this._current_pinch_view.on_pinch(event)
        } else if (event_type == "pinch:end") {
          this._current_pinch_view.on_pinch_end(event)
          this._current_pinch_view = null
        }
        srcEvent.preventDefault()
        return
      }
    } else if (base_type == "rotate") {
      const event = e as RotateEvent
      if (this._current_rotate_view == null) {
        if (event_type == "rotate:start") {
          for (const view of views) {
            if (!is_Rotatable(view)) {
              continue
            }
            if (view.on_rotate_start(event)) {
              this._current_rotate_view = view
              srcEvent.preventDefault()
              return
            }
          }
        }
      } else {
        if (event_type == "rotate") {
          this._current_rotate_view.on_rotate(event)
        } else if (event_type == "rotate:end") {
          this._current_rotate_view.on_rotate_end(event)
          this._current_rotate_view = null
        }
        srcEvent.preventDefault()
        return
      }
    } else if (base_type == "move") {
      const event = e as MoveEvent
      const new_views = new Set(views)

      const current_views = new Set(this._current_move_views)
      this._current_move_views = []

      for (const view of current_views) {
        if (!new_views.has(view)) {
          current_views.delete(view)
          view.on_leave(event)
        }
      }

      for (const view of views) {
        if (!is_Moveable(view)) {
          continue
        }

        if (!current_views.has(view)) {
          if (view.on_enter(e as MoveEvent)) {
            this._current_move_views.push(view)
          }
        } else {
          this._current_move_views.push(view)
          view.on_move(event)
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

    const top_view = views.at(0)

    switch (base_type) {
      case "move": {
        const active_gesture = gestures.move.active
        if (active_gesture != null) {
          this.trigger(signal, e, active_gesture)
        }

        const active_inspectors = plot_view.model.toolbar.inspectors.filter(t => t.active)

        const cursor = (() => {
          const current_view =
            this._current_interactive_tool_view ??
            this._current_pan_view ??
            this._current_pinch_view ??
            this._current_rotate_view ??
            this._current_move_views.at(0) ??
            top_view ??
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

        active_inspectors.map((inspector) => this.trigger(signal, e, inspector))
        break
      }
      case "tap": {
        const path: EventTarget[] = srcEvent.composedPath()
        if (path.length != 0 && path[0] != this.hit_area) {
          return // don't trigger bokeh events
        }

        top_view?.on_hit?.(e.sx, e.sy)

        if (this.hit_test_frame(plot_view, e.sx, e.sy)) {
          const active_gesture = gestures.tap.active
          if (active_gesture != null) {
            this.trigger(signal, e, active_gesture)
          }
        }
        break
      }
      case "doubletap": {
        if (this.hit_test_frame(plot_view, e.sx, e.sy)) {
          const active_gesture = gestures.doubletap.active ?? gestures.tap.active
          if (active_gesture != null) {
            this.trigger(signal, e, active_gesture)
          }
        }
        break
      }
      case "press": {
        if (this.hit_test_frame(plot_view, e.sx, e.sy)) {
          const active_gesture = gestures.press.active ?? gestures.tap.active
          if (active_gesture != null) {
            this.trigger(signal, e, active_gesture)
          }
        }
        break
      }
      case "pinch": {
        const active_gesture = gestures.pinch.active ?? gestures.scroll.active
        if (active_gesture != null) {
          if (this.trigger(signal, e, active_gesture)) {
            srcEvent.preventDefault()
            srcEvent.stopPropagation()
          }
        }
        break
      }
      case "scroll": {
        const active_gesture = gestures.scroll.active
        if (active_gesture != null) {
          if (this.trigger(signal, e, active_gesture)) {
            srcEvent.preventDefault()
            srcEvent.stopPropagation()
          }
        }
        break
      }
      case "pan": {
        const active_gesture = gestures.pan.active
        const active_pan_view = get_tool_view(active_gesture)
        if (active_pan_view != null) {
          switch (event_type) {
            case "pan:start": {
              this._current_interactive_tool_view = active_pan_view
              break
            }
            case "pan:end": {
              this._current_interactive_tool_view = null
              break
            }
          }

          if (this.trigger(signal, e, active_gesture)) {
            srcEvent.preventDefault()
            srcEvent.stopPropagation()
          }

          const cursor = active_pan_view.cursor(e.sx, e.sy)
          this.set_cursor(cursor)
        }
        break
      }
      default: {
        const active_gesture = gestures[base_type].active
        if (active_gesture != null) {
          this.trigger(signal, e, active_gesture)
        }
      }
    }

    this._trigger_bokeh_event(plot_view, e)
  }

  trigger<E extends UIEvent | KeyEvent>(signal: UISignal<E>, e: E, tool: ToolLike<Tool> | null = null): boolean {
    const emit = (tool: ToolLike<Tool>) => {
      const tool_view = this._tools.get(tool)
      if (tool_view == null) {
        return false
      }
      const fn = (() => {
        switch (signal) {
          case this.pan_start:    return tool_view._pan_start
          case this.pan:          return tool_view._pan
          case this.pan_end:      return tool_view._pan_end
          case this.pinch_start:  return tool_view._pinch_start
          case this.pinch:        return tool_view._pinch
          case this.pinch_end:    return tool_view._pinch_end
          case this.rotate_start: return tool_view._rotate_start
          case this.rotate:       return tool_view._rotate
          case this.rotate_end:   return tool_view._rotate_end
          case this.move_enter:   return tool_view._move_enter
          case this.move:         return tool_view._move
          case this.move_exit:    return tool_view._move_exit
          case this.tap:          return tool_view._tap
          case this.doubletap:    return tool_view._doubletap
          case this.press:        return tool_view._press
          case this.pressup:      return tool_view._pressup
          case this.scroll:       return tool_view._scroll
          case this.keydown:      return tool_view._keydown
          case this.keyup:        return tool_view._keyup
          default:                return null
        }
      })()

      if (fn == null) {
        return false
      }

      const val = fn.bind(tool_view)(e as any)
      if (isBoolean(val)) {
        return val
      } else {
        return true
      }
    }

    if (tool != null) {
      return emit(tool)
    } else {
      let result = false
      for (const tool of this._tools.keys()) {
        // don't conflate these lines because of short circuiting nature of ||= operator
        const emitted = emit(tool)
        result ||= emitted
      }
      return result
    }
  }

  /*protected*/ _trigger_bokeh_event(plot_view: PlotView, ev: UIEvent): void {
    const bokeh_event = (() => {
      const {sx, sy, modifiers} = ev
      const x = plot_view.frame.x_scale.invert(sx)
      const y = plot_view.frame.y_scale.invert(sy)

      switch (ev.type) {
        case "wheel":        return new events.MouseWheel(sx, sy, x, y, ev.delta, modifiers)
        case "enter":        return new events.MouseEnter(sx, sy, x, y, modifiers)
        case "move":         return new events.MouseMove(sx, sy, x, y, modifiers)
        case "leave":        return new events.MouseLeave(sx, sy, x, y, modifiers)
        case "tap":          return new events.Tap(sx, sy, x, y, modifiers)
        case "double_tap":   return new events.DoubleTap(sx, sy, x, y, modifiers)
        case "press":        return new events.Press(sx, sy, x, y, modifiers)
        case "press_up":     return new events.PressUp(sx, sy, x, y, modifiers)
        case "pan_start":    return new events.PanStart(sx, sy, x, y, modifiers)
        case "pan":          return new events.Pan(sx, sy, x, y, ev.dx, ev.dy, modifiers)
        case "pan_end":      return new events.PanEnd(sx, sy, x, y, modifiers)
        case "pinch_start":  return new events.PinchStart(sx, sy, x, y, modifiers)
        case "pinch":        return new events.Pinch(sx, sy, x, y, ev.scale, modifiers)
        case "pinch_end":    return new events.PinchEnd(sx, sy, x, y, modifiers)
        case "rotate_start": return new events.RotateStart(sx, sy, x, y, modifiers)
        case "rotate":       return new events.Rotate(sx, sy, x, y, ev.rotation, modifiers)
        case "rotate_end":   return new events.RotateEnd(sx, sy, x, y, modifiers)
        default:             return null
      }
    })()

    if (bokeh_event != null) {
      plot_view.model.trigger_event(bokeh_event)
    }
  }

  protected _get_sxy(event: MouseEvent): {sx: number, sy: number} {
    const {pageX, pageY} = event
    const {left, top} = offset_bbox(this.hit_area)
    return {
      sx: pageX - left,
      sy: pageY - top,
    }
  }

  protected _get_modifiers(event: MouseEvent | KeyboardEvent): KeyModifiers {
    return {
      shift: event.shiftKey,
      ctrl: event.ctrlKey,
      alt: event.altKey,
    }
  }

  protected _scroll_event(event: WheelEvent): ScrollEvent {
    return {
      type: event.type as ScrollEvent["type"],
      ...this._get_sxy(event),
      delta: getDeltaY(event),
      modifiers: this._get_modifiers(event),
      native: event,
    }
  }

  protected _key_event(event: KeyboardEvent): KeyEvent {
    return {
      type: event.type as KeyEvent["type"],
      key: event.key as Keys,
      modifiers: this._get_modifiers(event),
      native: event,
    }
  }

  on_tap(event: TapEvent): void {
    this._trigger(this.tap, event)
  }

  on_doubletap(event: TapEvent): void {
    this._trigger(this.doubletap, event)
  }

  on_press(event: TapEvent): void {
    this._trigger(this.press, event)
  }

  on_pressup(event: TapEvent): void {
    this._trigger(this.pressup, event)
  }

  on_enter(event: MoveEvent): void {
    this._trigger(this.move_enter, event)
  }

  on_move(event: MoveEvent): void {
    this._trigger(this.move, event)
  }

  on_leave(event: MoveEvent): void {
    this._trigger(this.move_exit, event)
  }

  on_pan_start(event: PanEvent): void {
    this._trigger(this.pan_start, event)
  }

  on_pan(event: PanEvent): void {
    this._trigger(this.pan, event)
  }

  on_pan_end(event: PanEvent): void {
    this._trigger(this.pan_end, event)
  }

  on_pinch_start(event: PinchEvent): void {
    this._trigger(this.pinch_start, event)
  }

  on_pinch(event: PinchEvent): void {
    this._trigger(this.pinch, event)
  }

  on_pinch_end(event: PinchEvent): void {
    this._trigger(this.pinch_end, event)
  }

  on_rotate_start(event: RotateEvent): void {
    this._trigger(this.rotate_start, event)
  }

  on_rotate(event: RotateEvent): void {
    this._trigger(this.rotate, event)
  }

  on_rotate_end(event: RotateEvent): void {
    this._trigger(this.rotate_end, event)
  }

  on_mouse_wheel(event: WheelEvent): void {
    this._trigger(this.scroll, this._scroll_event(event))
  }

  on_context_menu(_event: MouseEvent): void {
    // TODO
  }

  on_key_down(event: KeyboardEvent): void {
    // NOTE: keyup event triggered unconditionally
    this.trigger(this.keydown, this._key_event(event))
  }

  on_key_up(event: KeyboardEvent): void {
    // NOTE: keyup event triggered unconditionally
    this.trigger(this.keyup, this._key_event(event))
  }
}
