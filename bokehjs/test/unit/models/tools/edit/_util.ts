import type {PanEvent, TapEvent, MoveEvent, KeyEvent} from "@bokehjs/core/ui_events"
import type {Keys} from "@bokehjs/core/dom"

export function make_pan_event(sx: number, sy: number, shift: boolean = false): PanEvent {
  return {type: "pan", sx, sy, modifiers: {ctrl: false, shift, alt: false}, dx: 0, dy: 0, native: new PointerEvent("pointermove")}
}

export function make_tap_event(sx: number, sy: number, shift: boolean = false): TapEvent {
  return {type: "tap", sx, sy, modifiers: {ctrl: false, shift, alt: false}, native: new PointerEvent("pointerup")}
}

export function make_move_event(sx: number, sy: number): MoveEvent {
  return {type: "move", sx, sy, modifiers: {ctrl: false, shift: false, alt: false}, native: new PointerEvent("pointermove")}
}

export function make_key_event(key: Keys): KeyEvent {
  return {type: "keyup", key, modifiers: {ctrl: false, shift: false, alt: false}, native: new KeyboardEvent("keyup")}
}
