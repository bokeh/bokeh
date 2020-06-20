import Hammer, {Input} from "hammerjs"
type HammerEvent = typeof Input

import {Signal} from "./signaling"
import {logger} from "./logging"
import {offset, Keys} from "./dom"
import * as events from "./bokeh_events"
import {getDeltaY} from "./util/wheel"
import {reversed, is_empty} from "./util/array"
import {isString} from "./util/types"
import {is_mobile} from "./util/compat"
import {PlotView} from "../models/plots/plot"
import {Toolbar} from "../models/tools/toolbar"
import {ToolView} from "../models/tools/tool"
import {ContextMenu} from "./util/menus"
import {RendererView} from "../models/renderers/renderer"

function is_touch(event: unknown): event is TouchEvent {
  return typeof TouchEvent !== "undefined" && event instanceof TouchEvent
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

export type UISignal<E> = Signal<{id: string | null, e: E}, UIEvents>

export class UIEvents implements EventListenerObject {

  readonly pan_start:    UISignal<PanEvent> = new Signal(this, 'pan:start')
  readonly pan:          UISignal<PanEvent> = new Signal(this, 'pan')
  readonly pan_end:      UISignal<PanEvent> = new Signal(this, 'pan:end')

  readonly pinch_start:  UISignal<PinchEvent> = new Signal(this, 'pinch:start')
  readonly pinch:        UISignal<PinchEvent> = new Signal(this, 'pinch')
  readonly pinch_end:    UISignal<PinchEvent> = new Signal(this, 'pinch:end')

  readonly rotate_start: UISignal<RotateEvent> = new Signal(this, 'rotate:start')
  readonly rotate:       UISignal<RotateEvent> = new Signal(this, 'rotate')
  readonly rotate_end:   UISignal<RotateEvent> = new Signal(this, 'rotate:end')

  readonly tap:          UISignal<TapEvent>     = new Signal(this, 'tap')
  readonly doubletap:    UISignal<TapEvent>     = new Signal(this, 'doubletap')
  readonly press:        UISignal<TapEvent>     = new Signal(this, 'press')
  readonly pressup:      UISignal<TapEvent>     = new Signal(this, 'pressup')

  readonly move_enter:   UISignal<MoveEvent>    = new Signal(this, 'move:enter')
  readonly move:         UISignal<MoveEvent>    = new Signal(this, 'move')
  readonly move_exit:    UISignal<MoveEvent>    = new Signal(this, 'move:exit')

  readonly scroll:       UISignal<ScrollEvent>  = new Signal(this, 'scroll')

  readonly keydown:      UISignal<KeyEvent>     = new Signal(this, 'keydown')
  readonly keyup:        UISignal<KeyEvent>     = new Signal(this, 'keyup')

  private readonly hammer = new Hammer(this.hit_area, {
    touchAction: 'auto',
    inputClass: Hammer.TouchMouseInput, // https://github.com/bokeh/bokeh/issues/9187
  })

  private menu: ContextMenu

  constructor(readonly plot_view: PlotView,
              readonly toolbar: Toolbar,
              readonly hit_area: HTMLElement) {
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

    this.menu = new ContextMenu([], {
      prevent_hide: (event) => event.button == 2 && event.target == this.hit_area,
    })
    this.hit_area.appendChild(this.menu.el)
  }

  destroy(): void {
    this.menu.remove()
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
    this.hammer.get('doubletap').recognizeWith('tap')
    this.hammer.get('tap').requireFailure('doubletap')
    this.hammer.get('doubletap').dropRequireFailure('tap')

    this.hammer.on('doubletap', (e) => this._doubletap(e))
    this.hammer.on('tap', (e) => this._tap(e))
    this.hammer.on('press', (e) => this._press(e))
    this.hammer.on('pressup', (e) => this._pressup(e))

    this.hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL })
    this.hammer.on('panstart', (e) => this._pan_start(e))
    this.hammer.on('pan', (e) => this._pan(e))
    this.hammer.on('panend', (e) => this._pan_end(e))

    this.hammer.get('pinch').set({ enable: true })
    this.hammer.on('pinchstart', (e) => this._pinch_start(e))
    this.hammer.on('pinch', (e) => this._pinch(e))
    this.hammer.on('pinchend', (e) => this._pinch_end(e))

    this.hammer.get('rotate').set({ enable: true })
    this.hammer.on('rotatestart', (e) => this._rotate_start(e))
    this.hammer.on('rotate', (e) => this._rotate(e))
    this.hammer.on('rotateend', (e) => this._rotate_end(e))
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

    if (v._doubletap != null)
      v.connect(this.doubletap, unconditionally(v._doubletap.bind(v)))

    if (v._keydown != null)
      v.connect(this.keydown, unconditionally(v._keydown.bind(v)))

    if (v._keyup != null)
      v.connect(this.keyup, unconditionally(v._keyup.bind(v)))

    // Dual touch hack part 1/2
    // This is a hack for laptops with touch screen who may be pinching or scrolling
    // in order to use the wheel zoom tool. If it's a touch screen the WheelZoomTool event
    // will be linked to pinch. But we also want to trigger in the case of a scroll.
    if (is_mobile && v._scroll != null && et == 'pinch') {
      logger.debug("Registering scroll on touch screen")
      v.connect(this.scroll, conditionally(v._scroll.bind(v)))
    }
  }

  protected _hit_test_renderers(sx: number, sy: number): RendererView | null {
    const views = this.plot_view.get_renderer_views()

    for (const view of reversed(views)) {
      const {level} = view.model
      if ((level == 'annotation' || level == 'overlay') && view.interactive_hit != null) {
        if (view.interactive_hit(sx, sy))
          return view
      }
    }

    return null
  }

  protected _hit_test_frame(sx: number, sy: number): boolean {
    return this.plot_view.frame.bbox.contains(sx, sy)
  }

  protected _hit_test_canvas(sx: number, sy: number): boolean {
    return this.plot_view.layout.bbox.contains(sx, sy)
  }

  _trigger<E extends UIEvent>(signal: UISignal<E>, e: E, srcEvent: Event): void {
    const gestures = this.toolbar.gestures
    type BaseType = keyof typeof gestures

    const event_type = signal.name
    const base_type = event_type.split(":")[0] as BaseType
    const view = this._hit_test_renderers(e.sx, e.sy)
    const on_canvas = this._hit_test_canvas(e.sx, e.sy)

    switch (base_type) {
      case "move": {
        const active_gesture = gestures[base_type].active
        if (active_gesture != null)
          this.trigger(signal, e, active_gesture.id)

        const active_inspectors = this.toolbar.inspectors.filter(t => t.active)
        let cursor = "default"

        // the event happened on a renderer
        if (view != null) {
          cursor = view.cursor(e.sx, e.sy) || cursor

          if (!is_empty(active_inspectors)) {
            // override event_type to cause inspectors to clear overlays
            signal = this.move_exit as any // XXX
          }

        // the event happened on the plot frame but off a renderer
        } else if (this._hit_test_frame(e.sx, e.sy)) {
          if (!is_empty(active_inspectors)) {
            cursor = "crosshair"
          }
        }

        this.plot_view.set_cursor(cursor)
        this.plot_view.set_toolbar_visibility(on_canvas)

        active_inspectors.map((inspector) => this.trigger(signal, e, inspector.id))
        break
      }
      case "tap": {
        const {target} = srcEvent
        if (target != null && target != this.hit_area)
          return // don't trigger bokeh events

        if (view != null && view.on_hit != null)
          view.on_hit(e.sx, e.sy)

        const active_gesture = gestures[base_type].active
        if (active_gesture != null)
          this.trigger(signal, e, active_gesture.id)
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
        const active_gesture = gestures[base_type].active
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

    this._trigger_bokeh_event(e)
  }

  trigger<E>(signal: UISignal<E>, e: E, id: string | null = null): void {
    signal.emit({id, e})
  }

  protected _trigger_bokeh_event(e: UIEvent): void {
    const ev = (() => {
      const {sx, sy} = e
      const x = this.plot_view.frame.x_scale.invert(sx)
      const y = this.plot_view.frame.y_scale.invert(sy)

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
      this.plot_view.model.trigger_event(ev)
  }

  private _get_sxy(event: TouchEvent | MouseEvent | PointerEvent): ScreenCoord {
    const {pageX, pageY} = is_touch(event) ? (event.touches.length != 0 ? event.touches : event.changedTouches)[0] : event
    const {left, top} = offset(this.hit_area)
    return {
      sx: pageX - left,
      sy: pageY - top,
    }
  }

  private _pan_event(e: HammerEvent): PanEvent {
    return {
      type: e.type as PanEvent["type"],
      ...this._get_sxy(e.srcEvent),
      deltaX: e.deltaX,
      deltaY: e.deltaY,
      shiftKey: e.srcEvent.shiftKey,
      ctrlKey: e.srcEvent.ctrlKey,
    }
  }

  private _pinch_event(e: HammerEvent): PinchEvent {
    return {
      type: e.type as PinchEvent["type"],
      ...this._get_sxy(e.srcEvent),
      scale: e.scale,
      shiftKey: e.srcEvent.shiftKey,
      ctrlKey: e.srcEvent.ctrlKey,
    }
  }

  private _rotate_event(e: HammerEvent): RotateEvent {
    return {
      type: e.type as RotateEvent["type"],
      ...this._get_sxy(e.srcEvent),
      rotation: e.rotation,
      shiftKey: e.srcEvent.shiftKey,
      ctrlKey: e.srcEvent.ctrlKey,
    }
  }

  private _tap_event(e: HammerEvent): TapEvent {
    return {
      type: e.type as TapEvent["type"],
      ...this._get_sxy(e.srcEvent),
      shiftKey: e.srcEvent.shiftKey,
      ctrlKey: e.srcEvent.ctrlKey,
    }
  }

  private _move_event(e: MouseEvent): MoveEvent {
    return {
      type: e.type as MoveEvent["type"],
      ...this._get_sxy(e),
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
    }
  }

  private _scroll_event(e: WheelEvent): ScrollEvent {
    return {
      type: e.type as ScrollEvent["type"],
      ...this._get_sxy(e),
      delta: getDeltaY(e),
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
    }
  }

  private _key_event(e: KeyboardEvent): KeyEvent {
    return {
      type: e.type as KeyEvent["type"],
      keyCode: e.keyCode,
    }
  }

  private _pan_start(e: HammerEvent): void {
    const ev = this._pan_event(e)
    // back out delta to get original center point
    ev.sx -= e.deltaX
    ev.sy -= e.deltaY
    this._trigger(this.pan_start, ev, e.srcEvent)
  }

  private _pan(e: HammerEvent): void {
    this._trigger(this.pan, this._pan_event(e), e.srcEvent)
  }

  private _pan_end(e: HammerEvent): void {
    this._trigger(this.pan_end, this._pan_event(e), e.srcEvent)
  }

  private _pinch_start(e: HammerEvent): void {
    this._trigger(this.pinch_start, this._pinch_event(e), e.srcEvent)
  }

  private _pinch(e: HammerEvent): void {
    this._trigger(this.pinch, this._pinch_event(e), e.srcEvent)
  }

  private _pinch_end(e: HammerEvent): void {
    this._trigger(this.pinch_end, this._pinch_event(e), e.srcEvent)
  }

  private _rotate_start(e: HammerEvent): void {
    this._trigger(this.rotate_start, this._rotate_event(e), e.srcEvent)
  }

  private _rotate(e: HammerEvent): void {
    this._trigger(this.rotate, this._rotate_event(e), e.srcEvent)
  }

  private _rotate_end(e: HammerEvent): void {
    this._trigger(this.rotate_end, this._rotate_event(e), e.srcEvent)
  }

  private _tap(e: HammerEvent): void {
    this._trigger(this.tap, this._tap_event(e), e.srcEvent)
  }

  private _doubletap(e: HammerEvent): void {
    // NOTE: doubletap event triggered unconditionally
    const ev = this._tap_event(e)
    this._trigger_bokeh_event(ev)
    this.trigger(this.doubletap, ev)
  }

  private _press(e: HammerEvent): void {
    this._trigger(this.press, this._tap_event(e), e.srcEvent)
  }

  private _pressup(e: HammerEvent): void {
    this._trigger(this.pressup, this._tap_event(e), e.srcEvent)
  }

  private _mouse_enter(e: MouseEvent): void {
    this._trigger(this.move_enter, this._move_event(e), e)
  }

  private _mouse_move(e: MouseEvent): void {
    this._trigger(this.move, this._move_event(e), e)
  }

  private _mouse_exit(e: MouseEvent): void {
    this._trigger(this.move_exit, this._move_event(e), e)
  }

  private _mouse_wheel(e: WheelEvent): void {
    this._trigger(this.scroll, this._scroll_event(e), e)
  }

  private _context_menu(e: MouseEvent): void {
    if (!this.menu.is_open && this.menu.can_open) {
      e.preventDefault()
    }

    const {sx, sy} = this._get_sxy(e)
    this.menu.toggle({left: sx, top: sy})
  }

  private _key_down(e: KeyboardEvent): void {
    // NOTE: keyup event triggered unconditionally
    this.trigger(this.keydown, this._key_event(e))
  }

  private _key_up(e: KeyboardEvent): void {
    // NOTE: keyup event triggered unconditionally
    this.trigger(this.keyup, this._key_event(e))
  }
}
