import {Model} from "../../model"
import {CustomJS} from "../callbacks/customjs"
import type {ExecutableLike, SyncExecutableLike} from "core/util/callbacks"
import type * as p from "core/properties"
import {Enum} from "core/kinds"

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

export namespace KeyBinding {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    key: p.Property<KeyCombination | KeyCombination[]>
    when: p.Property<SyncExecutableLike<Model, [], boolean> | null>
    action: p.Property<ExecutableLike<Model, [], void>>
    priority: p.Property<number>
  }
}

export interface KeyBinding extends KeyBinding.Attrs {}

export class KeyBinding extends Model {
  declare properties: KeyBinding.Props

  constructor(attrs?: Partial<KeyBinding.Attrs>) {
    super(attrs)
  }

  static {
    this.define<KeyBinding.Props>(({Or, List, Ref, Nullable, Int, Func}) => ({
      key: [ Or(KeyCombination, List(KeyCombination)) ],
      when: [ Nullable(Or(Ref(CustomJS), Func<[], boolean>())), null ],
      action: [ Or(Ref(CustomJS), Func<[], void | Promise<void>>()) ],
      priority: [ Int, 0 ],
    }))
  }
}
