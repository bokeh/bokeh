import {InputWidget, InputWidgetView} from "./input_widget"
import type {VNode} from "core/vdom"
import {UIComponent} from "core/vdom"
import type * as p from "core/properties"
import {isString} from "core/util/types"
import * as inputs_css from "styles/widgets/inputs.css"

export class MultiSelectView extends InputWidgetView {
  declare readonly model: MultiSelect
  declare readonly signals: p.SignalsOf<MultiSelect.Props>
  declare readonly values: MultiSelect.Attrs

  /// TODO remove
  protected override _render_input(): HTMLElement {
    return undefined as any
  }
  ///

  override component(): VNode {
    const {name, options} = this.values
    const {disabled, size} = this.signals

    const selection = new Set(this.values.value)
    const children = options.map((option) => {
      const [value, label] = (() => {
        if (isString(option)) {
          return [option, option] as const
        } else {
          return option
        }
      })()
      const selected = selection.has(value)
      return <option value={value} selected={selected}>{label}</option>
    })

    return (
      <UIComponent parent={this.resolved_props}>
        <div class={inputs_css.outer}>
          <div class={inputs_css.inner}>
            <select
              multiple={true}
              class={inputs_css.input}
              name={name ?? undefined}
              disabled={disabled}
              size={size}
              onChange={() => this.change_input()}
            >
              {children}
            </select>
          </div>
        </div>
      </UIComponent>
    )
  }

  override change_input(): void {
    const values = []
    for (const el of this.shadow_el.querySelectorAll("option")) {
      if (el.selected) {
        values.push(el.value)
      }
    }

    this.model.value = values
    super.change_input()
  }
}

export namespace MultiSelect {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value: p.Property<string[]>
    options: p.Property<(string | [string, string])[]>
    size: p.Property<number>
  }
}

export interface MultiSelect extends MultiSelect.Attrs {}

export class MultiSelect extends InputWidget {
  declare properties: MultiSelect.Props
  declare __view_type__: MultiSelectView

  constructor(attrs?: Partial<MultiSelect.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = MultiSelectView

    this.define<MultiSelect.Props>(({Int, Str, List, Tuple, Or}) => ({
      value:   [ List(Str), [] ],
      options: [ List(Or(Str, Tuple(Str, Str))), [] ],
      size:    [ Int, 4 ], // 4 is the HTML default
    }))
  }
}
