import type {Options} from "choices.js"

/** Stable subset of Choices.js exposed by Bokeh views. */
export interface ChoicesInstance {
  readonly config: Options
  readonly input: {
    readonly element: HTMLInputElement
    isFocussed: boolean
  }
  destroy(): void
  disable(): this
  enable(): this
  getValue(valueOnly?: boolean): unknown
  showDropdown(preventInputFocus?: boolean): this
}
