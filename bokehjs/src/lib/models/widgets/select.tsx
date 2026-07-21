import {InputWidget, InputWidgetView} from "./input_widget"
import type {VNode} from "core/vdom"
import {UIComponent} from "core/vdom"
import {isString, isArray} from "core/util/types"
import {entries} from "core/util/object"
import {Unknown, Str, List, Tuple, Or, Dict} from "core/kinds"
import type * as p from "core/properties"
import * as inputs_css from "styles/widgets/inputs.css"

import {computed} from "@preact/signals"

const Value = Unknown
type Value = typeof Value["__type__"]

const Label = Str
type Label = typeof Label["__type__"]

const Options = List(Or(Label, Tuple(Value, Label)))
type Options = typeof Options["__type__"]

const OptionsGroups = Dict(Options)
type OptionsGroups = typeof OptionsGroups["__type__"]

const NotSelected = ""

export class SelectView extends InputWidgetView {
  declare readonly model: Select
  declare readonly signals: p.SignalsOf<Select.Props>
  declare readonly values: Select.Attrs

  /// TODO remove
  protected override _render_input(): HTMLElement {
    return undefined as any
  }
  ///

  private _known_values = computed<Map<Value, Label>>(() => {
    const _known_values = new Map<Value, Label>()

    function _collect_values(options: Options): void {
      for (const option of options) {
        const [value, label] = (() => {
          if (isString(option)) {
            return [option, option]
          } else {
            return option
          }
        })()

        _known_values.set(value, label)
      }
    }

    const {options} = this.values
    if (isArray(options)) {
      _collect_values(options)
    } else {
      for (const [, values] of entries(options)) {
        _collect_values(values)
      }
    }

    return _known_values
  })
  get known_values(): Map<Value, Label> {
    return this._known_values.value
  }

  private _selected_value = computed<string | undefined>(() => {
    return this.known_values.get(this.values.value)
  })
  get selected_value(): string | undefined {
    return this._selected_value.value
  }

  protected _build_options_or_optgroups(): VNode[] {
    const {selected_value} = this

    function build_options(options: Options): VNode[] {
      return options.map((option) => {
        const [value, label] = (() => {
          if (isString(option)) {
            return [option, option]
          } else {
            return option
          }
        })()

        const selected = value == selected_value
        return <option value={label} selected={selected}>{label}</option>
      })
    }

    const {options} = this.values
    if (isArray(options)) {
      return build_options(options)
    } else {
      return entries(options).map(([label, values]) => <optgroup label={label}>{build_options(values)}</optgroup>)
    }
  }

  override component(): VNode {
    const {name} = this.values
    const {disabled} = this.signals
    const {selected_value} = this

    return (
      <UIComponent parent={this.resolved_props}>
        <div class={inputs_css.outer}>
          <div class={inputs_css.inner}>
            <select
              class={inputs_css.input}
              name={name ?? undefined}
              disabled={disabled}
              value={selected_value}
              onChange={() => this.change_input()}
            >
              {this._build_options_or_optgroups()}
            </select>
          </div>
        </div>
      </UIComponent>
    )
  }

  override change_input(): void {
    const selected_label = this.shadow_el.querySelector("select")!.value
    const found = [...this.known_values].find(([_, label]) => selected_label == label)
    const value = (() => {
      if (found == null) {
        return NotSelected
      } else {
        const [value, _] = found
        return value
      }
    })()
    this.model.value = value
    super.change_input()
  }
}

export namespace Select {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value: p.Property<Value>
    options: p.Property<Options | OptionsGroups>
  }
}

export interface Select extends Select.Attrs {}

export class Select extends InputWidget {
  declare properties: Select.Props
  declare __view_type__: SelectView

  constructor(attrs?: Partial<Select.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SelectView

    this.define<Select.Props>(() => {
      return {
        value:   [ Value, NotSelected ],
        options: [ Or(Options, OptionsGroups), [] ],
      }
    })
  }
}
