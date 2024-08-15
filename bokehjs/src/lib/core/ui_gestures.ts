import {MouseButton, offset_bbox} from "./dom"
import {assert, unreachable} from "./util/assert"

export type KeyModifiers = {
  shift: boolean
  ctrl: boolean
  alt: boolean
}

export type TapEvent = {
  type: "tap" | "double_tap" | "press" | "press_up"
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
  type: "pan_start" | "pan" | "pan_end"
  sx: number
  sy: number
  dx: number
  dy: number
  modifiers: KeyModifiers
  native: PointerEvent
}

export type PinchEvent = {
  type: "pinch_start" | "pinch" | "pinch_end"
  sx: number
  sy: number
  scale: number
  modifiers: KeyModifiers
  native: PointerEvent // TODO two pointers
}

export type RotateEvent = {
  type: "rotate_start" | "rotate" | "rotate_end"
  sx: number
  sy: number
  rotation: number
  modifiers: KeyModifiers
  native: PointerEvent // TODO two pointers
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

export type Options = {
  /**
   * Whether the hit target must be the event target or are descendants permitted.
   * For example, canvas' events layer must be the event target, because we don't
   * want tooltips, toolbar or other panels to trigger UI events.
   */
  must_be_target?: boolean
}

type PointerId = typeof PointerEvent.prototype["pointerId"]
type Pointer = {init: PointerEvent, last: PointerEvent}

type GesturePhase =
  | "idle"         // before any pointer down
  | "started"      // at least one pointer down and waiting for either movement or pointer up or timeout
  | "pressing"     // one pointer down and reached press timeout
  | "panning"      // one pointer down and reached movement threshold
  | "pinching"     // two pointers down and reached scaling threshold
  | "rotating"     // two pointers down and reached rotational threshold
  | "transitional" // one pointer down after another was released (after pinching or rotation)

export class UIGestures {
  readonly must_be_target: boolean

  constructor(readonly hit_area: HTMLElement, readonly handlers: GestureHandlers, options: Options = {}) {
    this.must_be_target = options.must_be_target ?? false

    this._pointer_over = this._pointer_over.bind(this)
    this._pointer_out = this._pointer_out.bind(this)
    this._pointer_down = this._pointer_down.bind(this)
    this._pointer_move = this._pointer_move.bind(this)
    this._pointer_up = this._pointer_up.bind(this)
    this._pointer_cancel = this._pointer_cancel.bind(this)
  }

  connect_signals(): void {
    this.hit_area.addEventListener("pointerover", this._pointer_over)
    this.hit_area.addEventListener("pointerout", this._pointer_out)
    this.hit_area.addEventListener("pointerdown", this._pointer_down)
    this.hit_area.addEventListener("pointermove", this._pointer_move)
    this.hit_area.addEventListener("pointerup", this._pointer_up)
    this.hit_area.addEventListener("pointercancel", this._pointer_cancel)
  }

  disconnect_signals(): void {
    this.hit_area.removeEventListener("pointerover", this._pointer_over)
    this.hit_area.removeEventListener("pointerout", this._pointer_out)
    this.hit_area.removeEventListener("pointerdown", this._pointer_down)
    this.hit_area.removeEventListener("pointermove", this._pointer_move)
    this.hit_area.removeEventListener("pointerup", this._pointer_up)
    this.hit_area.removeEventListener("pointercancel", this._pointer_cancel)
  }

  remove(): void {
    this.disconnect_signals()
  }

  protected _self_is_target(event: PointerEvent): boolean {
    return event.composedPath()[0] == this.hit_area
  }

  protected _is_event_target(event: PointerEvent): boolean {
    return !this.must_be_target || this._self_is_target(event)
  }

  protected phase: GesturePhase = "idle"
  protected readonly pointers: Map<PointerId, Pointer> = new Map()
  protected press_timer: number | null = null
  protected tap_timestamp: number = -Infinity

  protected last_scale: number | null = null
  protected last_rotation: number | null = null

  reset(): void {
    this._cancel_timeout()
    this._user_select(true)

    this.phase = "idle"
    this.pointers.clear()
    this.press_timer = null
    this.tap_timestamp = -Infinity

    this.last_scale = null
    this.last_rotation = null
  }

  protected _user_select(allow: boolean): void {
    this.hit_area.style.userSelect = allow ? "" : "none"
  }

  static readonly move_threshold: number = 5/*px*/
  static readonly press_threshold: number = 300/*ms*/
  static readonly doubletap_threshold: number = 300/*ms*/
  static readonly pinch_threshold: number = 0/*unit less*/
  static readonly rotate_threshold: number = 0/*rad*/

  protected get _is_multi_gesture(): boolean {
    return this.pointers.size >= 2
  }

  protected _within_threshold(ptr: Pointer): boolean {
    const {dx, dy} = this._movement(ptr)
    return dx**2 + dy**2 <= UIGestures.move_threshold**2
  }

  protected get _any_movement(): boolean {
    return [...this.pointers.values()].some((ptr) => !this._within_threshold(ptr))
  }

  protected _start_timeout(): void {
    assert(this.press_timer == null)
    this.press_timer = setTimeout(() => this._pointer_timeout(), UIGestures.press_threshold)
  }

  protected _cancel_timeout(): void {
    const {press_timer} = this
    if (press_timer != null) {
      clearTimeout(press_timer)
      this.press_timer = null
    }
  }

  protected _pointer_timeout(): void {
    assert(this.phase == "started")
    assert(!this._is_multi_gesture)
    this.phase = "pressing"
    this.press_timer = null
    const [pointer] = this.pointers.values()
    this.on_press(pointer.init)
  }

  protected _pointer_over(event: PointerEvent): void {
    if (!this._is_event_target(event)) {
      return
    }
    if (event.isPrimary) {
      this.on_enter(event)
    }
  }

  protected _pointer_out(event: PointerEvent): void {
    if (!this._is_event_target(event)) {
      return
    }
    if (event.isPrimary) {
      this.on_leave(event)
    }
  }

  protected _pointer_down(event: PointerEvent): void {
    if (!this._is_event_target(event)) {
      return
    }
    if (this._is_multi_gesture) {
      return
    }
    if (this.pointers.has(event.pointerId)) {
      return
    }
    if (event.isPrimary && event.pointerType == "mouse" && event.buttons != MouseButton.Left) {
      return
    }
    if (!this.hit_area.isConnected) {
      return
    }
    this.pointers.set(event.pointerId, {init: event, last: event})
    this.hit_area.setPointerCapture(event.pointerId)
    this._user_select(false)
    switch (this.phase) {
      case "idle": {
        this.phase = "started"
        this._start_timeout()
        break
      }
      case "started": {
        this._cancel_timeout()
        break
      }
      case "pressing":
      case "panning":
      case "pinching":
      case "rotating":
      case "transitional":
        break
    }
  }

  protected _pointer_move(event: PointerEvent): void {
    if (!this._is_event_target(event)) {
      return
    }
    if (event.isPrimary) {
      this.on_move(event)
    }
    const pointer = this.pointers.get(event.pointerId)
    if (pointer == null) {
      return
    }
    pointer.last = event
    switch (this.phase) {
      case "idle": {
        this.reset()
        unreachable()
      }
      case "started":
      case "transitional": {
        if (!this._any_movement) {
          return
        }
        this._cancel_timeout()
        if (!this._is_multi_gesture) {
          this.phase = "panning"
          const [ptr] = this.pointers.values()
          const {dx, dy} = this._movement(ptr)
          this.on_pan_start(ptr.init, 0, 0)
          this.on_pan(ptr.last, dx, dy)
        } else {
          const [ptr0, ptr1] = this.pointers.values()
          const scale = this._scale(ptr0, ptr1)
          const rotation = this._rotation(ptr0, ptr1)
          if (Math.abs(scale - 1) > UIGestures.pinch_threshold) {
            this.phase = "pinching"
            this.on_pinch_start(ptr0.init, ptr1.init, 1)
            this.on_pinch(ptr0.last, ptr1.last, scale)
            this.last_scale = scale
          } else if (Math.abs(rotation) > UIGestures.rotate_threshold) {
            this.phase = "rotating"
            this.on_rotate_start(ptr0.init, ptr1.init, 0)
            this.on_rotate(ptr1.last, ptr1.last, rotation)
            this.last_rotation = rotation
          }
        }
        break
      }
      case "pressing": {
        break
      }
      case "panning": {
        const [ptr] = this.pointers.values()
        const {dx, dy} = this._movement(ptr)
        this.on_pan(event, dx, dy)
        break
      }
      case "pinching": {
        const [ptr0, ptr1] = this.pointers.values()
        const scale = this._scale(ptr0, ptr1)
        if (scale != this.last_scale) {
          this.on_pinch(ptr0.last, ptr1.last, scale)
          this.last_scale = scale
        }
        break
      }
      case "rotating": {
        const [ptr0, ptr1] = this.pointers.values()
        const rotation = this._rotation(ptr0, ptr1)
        if (rotation != this.last_rotation) {
          this.on_rotate(ptr0.last, ptr1.last, rotation)
          this.last_rotation = rotation
        }
        break
      }
    }
  }

  protected _pointer_up(event: PointerEvent): void {
    if (!this._is_event_target(event)) {
      return
    }
    const pointer = this.pointers.get(event.pointerId)
    if (pointer == null) {
      return
    }
    pointer.last = event
    this._cancel_timeout()
    switch (this.phase) {
      case "idle": {
        this.reset()
        unreachable()
      }
      case "started": {
        const [ptr] = this.pointers.values()
        const {tap_timestamp} = this
        if (ptr.last.timeStamp - tap_timestamp < UIGestures.doubletap_threshold) {
          this.tap_timestamp = -Infinity
          this.on_doubletap(ptr.last)
        } else {
          this.tap_timestamp = ptr.last.timeStamp
          this.on_tap(ptr.last)
        }
        this.phase = "idle"
        break
      }
      case "transitional": {
        this.phase = "idle"
        break
      }
      case "pressing": {
        const [ptr] = this.pointers.values()
        this.on_pressup(ptr.last)
        this.phase = "idle"
        break
      }
      case "panning": {
        const [ptr] = this.pointers.values()
        const {dx, dy} = this._movement(ptr)
        this.on_pan_end(event, dx, dy)
        this.phase = "idle"
        break
      }
      case "pinching": {
        const [ptr0, ptr1] = this.pointers.values()
        const scale = this._scale(ptr0, ptr1)
        this.on_pinch_end(ptr0.last, ptr1.last, scale)
        this.phase = "transitional"
        this.last_scale = null
        break
      }
      case "rotating": {
        const [ptr0, ptr1] = this.pointers.values()
        const rotation = this._rotation(ptr0, ptr1)
        this.on_rotate_end(ptr0.last, ptr1.last, rotation)
        this.phase = "transitional"
        this.last_rotation = null
        break
      }
    }
    this.pointers.delete(event.pointerId)
    if (this.phase == "transitional") {
      const [ptr] = this.pointers.values()
      ptr.init = ptr.last
    }
    if (this.pointers.size == 0) {
      this._user_select(true)
    }
  }

  protected _pointer_cancel(event: PointerEvent): void {
    if (!this.pointers.has(event.pointerId)) {
      return
    }
    this._cancel_timeout()
    switch (this.phase) {
      case "idle": {
        this.reset()
        unreachable()
      }
      case "started":
      case "pressing":
      case "transitional": {
        this.phase = "idle"
        break
      }
      case "panning": {
        const [ptr] = this.pointers.values()
        const {dx, dy} = this._movement(ptr)
        this.on_pan_end(event, dx, dy)
        this.phase = "idle"
        break
      }
      case "pinching": {
        const [ptr0, ptr1] = this.pointers.values()
        const scale = this._scale(ptr0, ptr1)
        this.on_pinch_end(ptr0.last, ptr1.last, scale)
        this.phase = "transitional"
        this.last_scale = null
        break
      }
      case "rotating": {
        const [ptr0, ptr1] = this.pointers.values()
        const rotation = this._rotation(ptr0, ptr1)
        this.on_rotate_end(ptr0.last, ptr1.last, rotation)
        this.phase = "transitional"
        this.last_rotation = null
        break
      }
    }
    this.pointers.delete(event.pointerId)
    if (this.phase == "transitional") {
      const [ptr] = this.pointers.values()
      ptr.init = ptr.last
    }
    if (this.pointers.size == 0) {
      this._user_select(true)
    }
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
      on_doubletap(this._tap_event("double_tap", ev))
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
      on_pressup(this._tap_event("press_up", ev))
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
      on_pan_start(this._pan_event("pan_start", ev, dx, dy))
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
      on_pan_end(this._pan_event("pan_end", ev, dx, dy))
    }
  }

  on_pinch_start(ev0: PointerEvent, ev1: PointerEvent, scale: number): void {
    const {on_pinch_start} = this.handlers
    if (on_pinch_start != null) {
      on_pinch_start(this._pinch_event("pinch_start", ev0, ev1, scale))
    }
  }
  on_pinch(ev0: PointerEvent, ev1: PointerEvent, scale: number): void {
    const {on_pinch} = this.handlers
    if (on_pinch != null) {
      on_pinch(this._pinch_event("pinch", ev0, ev1, scale))
    }
  }
  on_pinch_end(ev0: PointerEvent, ev1: PointerEvent, scale: number): void {
    const {on_pinch_end} = this.handlers
    if (on_pinch_end != null) {
      on_pinch_end(this._pinch_event("pinch_end", ev0, ev1, scale))
    }
  }

  on_rotate_start(ev0: PointerEvent, ev1: PointerEvent, rotation: number): void {
    const {on_rotate_start} = this.handlers
    if (on_rotate_start != null) {
      on_rotate_start(this._rotate_event("rotate_start", ev0, ev1, rotation))
    }
  }
  on_rotate(ev0: PointerEvent, ev1: PointerEvent, rotation: number): void {
    const {on_rotate} = this.handlers
    if (on_rotate != null) {
      on_rotate(this._rotate_event("rotate", ev0, ev1, rotation))
    }
  }
  on_rotate_end(ev0: PointerEvent, ev1: PointerEvent, rotation: number): void {
    const {on_rotate_end} = this.handlers
    if (on_rotate_end != null) {
      on_rotate_end(this._rotate_event("rotate_end", ev0, ev1, rotation))
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

  protected _pinch_event(type: PinchEvent["type"], event0: PointerEvent, event1: PointerEvent, scale: number): PinchEvent {
    const {sx: sx0, sy: sy0} = this._get_sxy(event0)
    const {sx: sx1, sy: sy1} = this._get_sxy(event1)
    return {
      type,
      sx: (sx0 + sx1)/2,
      sy: (sy0 + sy1)/2,
      scale,
      modifiers: this._get_modifiers(event0),
      native: event0,
    }
  }

  protected _rotate_event(type: RotateEvent["type"], event0: PointerEvent, event1: PointerEvent, rotation: number): RotateEvent {
    const {sx: sx0, sy: sy0} = this._get_sxy(event0)
    const {sx: sx1, sy: sy1} = this._get_sxy(event1)
    return {
      type,
      sx: (sx0 + sx1)/2,
      sy: (sy0 + sy1)/2,
      rotation,
      modifiers: this._get_modifiers(event0),
      native: event0,
    }
  }

  protected _movement(ptr: Pointer): {dx: number, dy: number} {
    return {
      dx: ptr.last.x - ptr.init.x,
      dy: ptr.last.y - ptr.init.y,
    }
  }

  protected _distance(ev0: PointerEvent, ev1: PointerEvent): number {
    const x = ev1.x - ev0.x
    const y = ev1.y - ev0.y
    return Math.sqrt(x**2 + y**2)
  }

  protected _angle(ev0: PointerEvent, ev1: PointerEvent): number {
    const x = ev1.x - ev0.x
    const y = ev1.y - ev0.y
    return Math.atan2(y, x)*180/Math.PI
  }

  protected _scale(ptr0: Pointer, ptr1: Pointer): number {
    return this._distance(ptr0.last, ptr1.last)/this._distance(ptr0.init, ptr1.init)
  }

  protected _rotation(ptr0: Pointer, ptr1: Pointer): number {
    return this._angle(ptr1.last, ptr0.last) + this._angle(ptr1.init, ptr0.init)
  }
}
