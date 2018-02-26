import {GestureEvent, TapEvent, MoveEvent, KeyEvent} from "core/ui_events"
import {Keys} from "core/dom"

export function make_gesture_event(sx: number, sy: number, shift: boolean = false): GestureEvent {
  return {type: "pan", sx, sy, shiftKey: shift, deltaX: 0, deltaY: 0, scale: 1}
}

export function make_tap_event(sx: number, sy: number, shift: boolean = false): TapEvent {
  return {type: "tap", sx, sy, shiftKey: shift}
}

export function make_move_event(sx: number, sy: number): MoveEvent {
  return {type: "move", sx, sy}
}

export function make_key_event(key: Keys): KeyEvent {
  return {type: "key", keyCode: key}
}
