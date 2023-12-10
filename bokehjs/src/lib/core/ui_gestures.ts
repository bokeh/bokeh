import {MouseButton, offset_bbox} from "./dom"
import {assert} from "./util/assert"

export type KeyModifiers = {
  shift: boolean
  ctrl: boolean
  alt: boolean
}

export type TapEvent = {
  type: "tap" | "doubletap" | "press" | "pressup" | "contextmenu"
  sx: number
  sy: number
  modifiers: KeyModifiers
  native: PointerEvent
}

export type MoveEvent = {
  type: "enter" | "move" | "leave"
  sx: number
  sy: number
  modifiers: KeyModifiers
  native: PointerEvent
}

export type PanEvent = {
  type: "panstart" | "pan" | "panend"
  sx: number
  sy: number
  dx: number
  dy: number
  modifiers: KeyModifiers
  native: PointerEvent
}

export type PinchEvent = {
  type: "pinchstart" | "pinch" | "pinchend"
  sx: number
  sy: number
  scale: number
  modifiers: KeyModifiers
  native: PointerEvent
}

export type RotateEvent = {
  type: "rotatestart" | "rotate" | "rotateend"
  sx: number
  sy: number
  rotation: number
  modifiers: KeyModifiers
  native: PointerEvent
}

export type GestureHandlers = {
  on_tap?(event: TapEvent): void
  on_doubletap?(event: TapEvent): void
  on_press?(event: TapEvent): void
  on_pressup?(event: TapEvent): void

  on_enter?(event: MoveEvent): void
  on_move?(event: MoveEvent): void
  on_leave?(event: MoveEvent): void

  on_pan_start?(event: PanEvent): void
  on_pan?(event: PanEvent): void
  on_pan_end?(event: PanEvent): void

  on_pinch_start?(event: PinchEvent): void
  on_pinch?(event: PinchEvent): void
  on_pinch_end?(event: PinchEvent): void

  on_rotate_start?(event: RotateEvent): void
  on_rotate?(event: RotateEvent): void
  on_rotate_end?(event: RotateEvent): void
}

export class UIGestures {

  constructor(readonly hit_area: HTMLElement, readonly handlers: GestureHandlers) {
    this._pointer_enter = this._pointer_enter.bind(this)
    this._pointer_leave = this._pointer_leave.bind(this)
    this._pointer_down = this._pointer_down.bind(this)
    this._pointer_move = this._pointer_move.bind(this)
    this._pointer_up = this._pointer_up.bind(this)
    this._pointer_cancel = this._pointer_cancel.bind(this)
  }

  connect_signals(): void {
    this.hit_area.addEventListener("pointerenter", this._pointer_enter)
    this.hit_area.addEventListener("pointerleave", this._pointer_leave)
    this.hit_area.addEventListener("pointerdown", this._pointer_down)
    this.hit_area.addEventListener("pointermove", this._pointer_move)
    this.hit_area.addEventListener("pointerup", this._pointer_up)
    this.hit_area.addEventListener("pointercancel", this._pointer_cancel)
  }

  disconnect_signals(): void {
    this.hit_area.removeEventListener("pointerenter", this._pointer_enter)
    this.hit_area.removeEventListener("pointerleave", this._pointer_leave)
    this.hit_area.removeEventListener("pointerdown", this._pointer_down)
    this.hit_area.removeEventListener("pointermove", this._pointer_move)
    this.hit_area.removeEventListener("pointerup", this._pointer_up)
    this.hit_area.removeEventListener("pointercancel", this._pointer_cancel)
  }

  remove(): void {
    this.disconnect_signals()
  }

  private state: {
    event: PointerEvent
    phase: "started" | "pressing" | "panning" // "pinching" | "rotating"
    timer: number | null
  } | null = null

  private tap_timestamp: number = -Infinity

  static readonly move_threshold: number = 5/*px*/
  static readonly press_threshold: number = 300/*ms*/
  static readonly doubletap_threshold: number = 300/*ms*/

  protected _pointer_enter(ev: PointerEvent): void {
    if (ev.isPrimary) {
      this.on_enter(ev)
    }
  }

  protected _pointer_leave(ev: PointerEvent): void {
    if (ev.isPrimary) {
      this.on_leave(ev)
    }
  }

  protected _pointer_down(ev: PointerEvent): void {
    if (ev.composedPath()[0] != this.hit_area) {
      return
    }
    if (!ev.isPrimary) {
      return
    }
    if (ev.pointerType == "mouse" && ev.buttons != MouseButton.Left) {
      return
    }
    assert(this.state == null)
    this.state = {
      event: ev,
      phase: "started",
      timer: setTimeout(() => this._pointer_timeout(), UIGestures.press_threshold),
    }
    this.hit_area.setPointerCapture(ev.pointerId)
  }

  protected _cancel_timeout(): void {
    const {state} = this
    assert(state != null)
    if (state.timer != null) {
      clearTimeout(state.timer)
      state.timer = null
    }
  }

  protected _pointer_timeout(): void {
    const {state} = this
    assert(state != null && state.phase == "started")
    state.phase = "pressing"
    state.timer = null
    this.on_press(state.event)
  }

  protected _pointer_move(ev: PointerEvent): void {
    if (ev.isPrimary) {
      this.on_move(ev)
    }
    const {state} = this
    if (state?.event.pointerId != ev.pointerId) {
      return
    }
    const ev0 = state.event
    const ev1 = ev
    const dx = ev1.x - ev0.x
    const dy = ev1.y - ev0.y
    switch (state.phase) {
      case "started": {
        if (dx**2 + dy**2 <= UIGestures.move_threshold**2) {
          return
        }
        this._cancel_timeout()
        state.phase = "panning"
        this.on_pan_start(ev0, dx, dy)
        this.on_pan(ev1, dx, dy)
        break
      }
      case "pressing": {
        break
      }
      case "panning": {
        this.on_pan(ev1, dx, dy)
        break
      }
    }
  }

  protected _pointer_up(ev: PointerEvent): void {
    if (ev.composedPath()[0] != this.hit_area) {
      return
    }
    const {state} = this
    if (state?.event.pointerId != ev.pointerId) {
      return
    }
    this._cancel_timeout()
    const ev0 = state.event
    const ev1 = ev
    switch (state.phase) {
      case "started": {
        const {tap_timestamp} = this
        if (ev1.timeStamp - tap_timestamp < UIGestures.doubletap_threshold) {
          this.tap_timestamp = -Infinity
          this.on_doubletap(ev0)
        } else {
          this.tap_timestamp = ev1.timeStamp
          this.on_tap(ev0)
        }
        break
      }
      case "pressing": {
        this.on_pressup(ev1)
        break
      }
      case "panning": {
        const dx = ev1.x - ev0.x
        const dy = ev1.y - ev0.y
        this.on_pan_end(ev1, dx, dy)
        break
      }
    }
    this.state = null
  }

  protected _pointer_cancel(ev: PointerEvent): void {
    const {state} = this
    if (state?.event.pointerId != ev.pointerId) {
      return
    }
    this._cancel_timeout()
    if (state.phase == "panning") {
      const ev0 = state.event
      const ev1 = ev
      const dx = ev1.x - ev0.x
      const dy = ev1.y - ev0.y
      this.on_pan_end(ev, dx, dy)
    }
    this.state = null
  }

  on_tap(ev: PointerEvent): void {
    const {on_tap} = this.handlers
    if (on_tap != null) {
      on_tap(this._tap_event("tap", ev))
    }
  }
  on_doubletap(ev: PointerEvent): void {
    const {on_doubletap} = this.handlers
    if (on_doubletap != null) {
      on_doubletap(this._tap_event("doubletap", ev))
    }
  }
  on_press(ev: PointerEvent): void {
    const {on_press} = this.handlers
    if (on_press != null) {
      on_press(this._tap_event("press", ev))
    }
  }
  on_pressup(ev: PointerEvent): void {
    const {on_pressup} = this.handlers
    if (on_pressup != null) {
      on_pressup(this._tap_event("pressup", ev))
    }
  }

  on_enter(ev: PointerEvent): void {
    const {on_enter} = this.handlers
    if (on_enter != null) {
      on_enter(this._move_event("enter", ev))
    }
  }
  on_move(ev: PointerEvent): void {
    const {on_move} = this.handlers
    if (on_move != null) {
      on_move(this._move_event("move", ev))
    }
  }
  on_leave(ev: PointerEvent): void {
    const {on_leave} = this.handlers
    if (on_leave != null) {
      on_leave(this._move_event("leave", ev))
    }
  }

  on_pan_start(ev: PointerEvent, dx: number, dy: number): void {
    const {on_pan_start} = this.handlers
    if (on_pan_start != null) {
      on_pan_start(this._pan_event("panstart", ev, dx, dy))
    }
  }
  on_pan(ev: PointerEvent, dx: number, dy: number): void {
    const {on_pan} = this.handlers
    if (on_pan != null) {
      on_pan(this._pan_event("pan", ev, dx, dy))
    }
  }
  on_pan_end(ev: PointerEvent, dx: number, dy: number): void {
    const {on_pan_end} = this.handlers
    if (on_pan_end != null) {
      on_pan_end(this._pan_event("panend", ev, dx, dy))
    }
  }

  on_pinch_start(ev: PointerEvent, scale: number): void {
    const {on_pinch_start} = this.handlers
    if (on_pinch_start != null) {
      on_pinch_start(this._pinch_event("pinchstart", ev, scale))
    }
  }
  on_pinch(ev: PointerEvent, scale: number): void {
    const {on_pinch} = this.handlers
    if (on_pinch != null) {
      on_pinch(this._pinch_event("pinch", ev, scale))
    }
  }
  on_pinch_end(ev: PointerEvent, scale: number): void {
    const {on_pinch_end} = this.handlers
    if (on_pinch_end != null) {
      on_pinch_end(this._pinch_event("pinchend", ev, scale))
    }
  }

  on_rotate_start(ev: PointerEvent, rotation: number): void {
    const {on_rotate_start} = this.handlers
    if (on_rotate_start != null) {
      on_rotate_start(this._rotate_event("rotatestart", ev, rotation))
    }
  }
  on_rotate(ev: PointerEvent, rotation: number): void {
    const {on_rotate} = this.handlers
    if (on_rotate != null) {
      on_rotate(this._rotate_event("rotate", ev, rotation))
    }
  }
  on_rotate_end(ev: PointerEvent, rotation: number): void {
    const {on_rotate_end} = this.handlers
    if (on_rotate_end != null) {
      on_rotate_end(this._rotate_event("rotateend", ev, rotation))
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

  protected _tap_event(type: TapEvent["type"], event: PointerEvent): TapEvent {
    return {
      type,
      ...this._get_sxy(event),
      modifiers: this._get_modifiers(event),
      native: event,
    }
  }

  protected _move_event(type: MoveEvent["type"], event: PointerEvent): MoveEvent {
    return {
      type,
      ...this._get_sxy(event),
      modifiers: this._get_modifiers(event),
      native: event,
    }
  }

  protected _pan_event(type: PanEvent["type"], event: PointerEvent, dx: number, dy: number): PanEvent {
    return {
      type,
      ...this._get_sxy(event),
      dx,
      dy,
      modifiers: this._get_modifiers(event),
      native: event,
    }
  }

  protected _pinch_event(type: PinchEvent["type"], event: PointerEvent, scale: number): PinchEvent {
    return {
      type,
      ...this._get_sxy(event),
      scale,
      modifiers: this._get_modifiers(event),
      native: event,
    }
  }

  protected _rotate_event(type: RotateEvent["type"], event: PointerEvent, rotation: number): RotateEvent {
    return {
      type,
      ...this._get_sxy(event),
      rotation,
      modifiers: this._get_modifiers(event),
      native: event,
    }
  }
}
