import {PanEvent, TapEvent, MoveEvent, KeyEvent} from "@bokehjs/core/ui_events"
import {Keys} from "@bokehjs/core/dom"

export function make_pan_event(sx: number, sy: number, shift: boolean = false): PanEvent {
  return {type: "pan", sx, sy, shiftKey: shift, deltaX: 0, deltaY: 0}
}

export function make_tap_event(sx: number, sy: number, shift: boolean = false): TapEvent {
  return {type: "tap", sx, sy, shiftKey: shift}
}

export function make_move_event(sx: number, sy: number): MoveEvent {
  return {type: "mousemove", sx, sy}
}

export function make_key_event(key: Keys): KeyEvent {
  return {type: "keyup", keyCode: key}
}
