import type {Model} from "model"
import {Enum, List} from "core/kinds"
import type {ExecutableLike, SyncExecutableLike} from "core/util/callbacks"

export const UpperKey = Enum(
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "~", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+",
  "{", "}", "|", ":", "\"", "<", ">", "?",
)
export type UpperKey = typeof UpperKey["__type__"]

export const LowerKey = Enum(
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
  "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
  "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=",
  "[", "]", "\\", ";", "'", ",", ".", "/",
)
export type LowerKey = typeof LowerKey["__type__"]

export const PrintableKey = Enum(...UpperKey, ...LowerKey)
export type PrintableKey = typeof PrintableKey["__type__"]

export const WhitespaceKey = Enum("Enter", "Tab", "Space", " ")
export type WhitespaceKey = typeof WhitespaceKey["__type__"]

export const UIKey = Enum("Escape")
export type UIKey = typeof UIKey["__type__"]

export const NavigationKey = Enum("ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp", "End", "Home", "PageDown", "PageUp")
export type NavigationKey = typeof NavigationKey["__type__"]

export const EditingKey = Enum("Backspace", "Delete", "Insert")
export type EditingKey = typeof EditingKey["__type__"]

export const FunctionKey = Enum("F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12")
export type FunctionKey = typeof FunctionKey["__type__"]

export const ModifierKey = Enum("Ctrl", "Shift", "Alt", "Meta")
export type ModifierKey = typeof ModifierKey["__type__"]

export const NonModifierKey = Enum(...PrintableKey, ...WhitespaceKey, ...UIKey, ...NavigationKey, ...EditingKey, ...FunctionKey)
export type NonModifierKey = typeof NonModifierKey["__type__"]

export const Key = Enum(...NonModifierKey, ...ModifierKey)
export type Key = typeof Key["__type__"]

export const KeyCombination = Enum(
  ...[...NonModifierKey].flatMap((key) => [
    key,
    `Ctrl+${key}` as const,
    `Shift+${key}` as const,
    `Alt+${key}` as const,
    `Meta+${key}` as const,
    `Ctrl+Shift+${key}` as const,
    `Ctrl+Alt+${key}` as const,
    `Ctrl+Meta+${key}` as const,
    `Ctrl+Shift+Alt+${key}` as const,
    `Ctrl+Shift+Meta+${key}` as const,
    `Shift+Alt+${key}` as const,
    `Shift+Meta+${key}` as const,
    `Alt+Meta+${key}` as const,
  ]),
)
export type KeyCombination = typeof KeyCombination["__type__"]

export const KeySequence = List(KeyCombination)
export type KeySequence = typeof KeySequence["__type__"]

export type KeyBinding = {
  description: string
  keys: KeySequence
  command?: string
  when?: SyncExecutableLike<Model, [], boolean>
  action: ExecutableLike<Model, [], void>
  priority?: number
}

export type KeyModifiers = {
  shift: boolean
  ctrl: boolean
  alt: boolean
}

export type KeyState = {
  key: Key
  modifiers: KeyModifiers
}

export function is_upper_like(key: Key): boolean {
  if (key.length != 1) {
    return false
  }
  if ("A" <= key && key <= "Z") {
    return true
  } else {
    switch (key) {
      case "~":
      case "!":
      case "@":
      case "#":
      case "$":
      case "%":
      case "^":
      case "&":
      case "*":
      case "(":
      case ")":
      case "_":
      case "+":
      case "{":
      case "}":
      case "|":
      case ":":
      case "\"":
      case "<":
      case ">":
      case "?":
        return true
      default:
        return false
    }
  }
}

export function parse(key_combination: KeyCombination): KeyState {
  const keys = key_combination.split("+")
  const key = keys[keys.length - 1]
  const result = {
    key: key == "" ? "+" : key as NonModifierKey,
    modifiers: {ctrl: false, shift: false, alt: false},
  }
  for (const key of keys) {
    switch (key) {
      case "Ctrl": {
        result.modifiers.ctrl = true
        break
      }
      case "Shift": {
        result.modifiers.shift = true
        break
      }
      case "Alt": {
        result.modifiers.alt = true
        break
      }
    }
  }
  if (is_upper_like(result.key)) {
    result.modifiers.shift = true
  }
  return result
}

export function unparse(key_state: KeyState): KeyCombination {
  const {key, modifiers} = key_state
  let s = ""
  if (modifiers.ctrl) {
    s += "Ctrl+"
  }
  if (modifiers.shift && !is_upper_like(key)) {
    s += "Shift+"
  }
  if (modifiers.alt) {
    s += "Alt+"
  }
  switch (key) {
    case " ": {
      s += "Space"
      break
    }
    default: {
      s += key
    }
  }
  return s as KeyCombination
}
