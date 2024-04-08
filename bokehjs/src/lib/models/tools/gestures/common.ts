import {PartialStruct, Bool} from "core/kinds"

export const Modifiers = PartialStruct({shift: Bool, ctrl: Bool, alt: Bool})
export type Modifiers = typeof Modifiers["__type__"]

export function satisfies_modifiers(expected: Modifiers, received: Modifiers): boolean {
  if (expected.shift != null && expected.shift != received.shift) {
    return false
  }
  if (expected.ctrl != null && expected.ctrl != received.ctrl) {
    return false
  }
  if (expected.alt != null && expected.alt != received.alt) {
    return false
  }
  return true
}
