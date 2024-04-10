import {PartialStruct, Bool} from "core/kinds"

export const Modifiers = PartialStruct({shift: Bool, ctrl: Bool, alt: Bool})
export type Modifiers = typeof Modifiers["__type__"]

export function satisfies_modifiers(expected: Modifiers, received: Modifiers): boolean {
  const {alt, ctrl, shift} = expected
  if (shift != null && shift != received.shift) {
    return false
  }
  if (ctrl != null && ctrl != received.ctrl) {
    return false
  }
  if (alt != null && alt != received.alt) {
    return false
  }
  return true
}

export function print_modifiers(modifiers: Modifiers): string {
  const {alt, ctrl, shift} = modifiers
  const result = []
  if (alt === true) {
    result.push("alt")
  }
  if (ctrl === true) {
    result.push("ctrl")
  }
  if (shift === true) {
    result.push("shift")
  }
  return result.join(" + ")
}
