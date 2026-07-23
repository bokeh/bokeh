import * as numbro from "@bokeh/numbro"

import {InputWidgetView, InputWidget} from "./input_widget"
import {TickFormatter} from "../formatters/tick_formatter"
import type {VNode} from "core/vdom"
import {UIComponent} from "core/vdom"
import {bind} from "core/class"
import {ValueSubmit} from "core/bokeh_events"
import {isString} from "core/util/types"
import {assert} from "core/util/assert"
import type * as p from "core/properties"
import * as inputs_css from "styles/widgets/inputs.css"

import type {TargetedKeyboardEvent} from "preact"
import {computed} from "@preact/signals"

const int_regex = /^[-+]?\d*$/
const float_regex = /^[-+]?\d*\.?\d*(?:(?:\d|\d.)[eE][-+]?)*\d*$/

export class NumericInputView extends InputWidgetView {
  declare readonly model: NumericInput
  declare readonly signals: p.SignalsOf<NumericInput.Props>
  declare readonly values: NumericInput.Attrs

  /// TODO remove
  protected override _render_input(): HTMLElement {
    return undefined as any
  }
  declare input_el: never
  ///

  protected old_value: string

  override connect_signals(): void {
    super.connect_signals()

    this.connect(this.model.properties.low.change, () => {
      const {value, low, high} = this.model
      if (low != null && high != null) {
        assert(low <= high, "Invalid bounds, low must be inferior to high")
      }
      if (value != null && low != null && value < low) {
        this.model.value = low
      }
    })
    this.connect(this.model.properties.high.change, () => {
      const {value, low, high} = this.model
      if (low != null && high != null) {
        assert(high >= low, "Invalid bounds, high must be superior to low")
      }
      if (value != null && high != null && value > high) {
        this.model.value = high
      }
    })
  }

  private _format_value = computed<string>(() => {
    const {value} = this.values
    return value != null ? this.model.pretty(value) : ""
  })
  get format_value(): string {
    return this._format_value.value
  }

  protected _buttons?(): VNode

  override component(): VNode {
    const {disabled, placeholder} = this.signals
    const {prefix, suffix, name, mode} = this.values
    const {format_value} = this

    const input_filter = (() => {
      const regex = mode == "int" ? int_regex : float_regex
      return (value: string) => regex.test(value)
    })()

    this.old_value = this.format_value

    const Title = this._title_el
    return (
      <UIComponent parent={this.resolved_props}>
        <Title></Title>
        <div class={inputs_css.outer}>
          {prefix != null ? <div class={inputs_css.prefix}>{prefix}</div> : null}
          <div class={inputs_css.inner}>
            <input
              type="text"
              class={inputs_css.input}
              name={name ?? undefined}
              disabled={disabled}
              value={format_value}
              placeholder={placeholder}
              onKeyUp={this._key_up}
              onChange={(event) => this.change_value(event.currentTarget)}
              onInput={(event) => this.filter_value(event.currentTarget, input_filter)}
              //onFocusOut={() => this.input_el.value = this.format_value}
            />
            {this._buttons != null ? <div class={inputs_css.buttons}>{this._buttons()}</div> : null}
          </div>
          {suffix != null ? <div class={inputs_css.suffix}>{suffix}</div> : null}
        </div>
      </UIComponent>
    )
  }

  @bind
  protected _key_up(event: TargetedKeyboardEvent<HTMLInputElement>): void {
    if (event.key == "Enter" && !event.shiftKey && !event.ctrlKey && !event.altKey) {
      this.model.trigger_event(new ValueSubmit(event.currentTarget.value))
    }
  }

  bound_value(value: number): number {
    const {low, high} = this.model
    value = low != null ? Math.max(low, value) : value
    value = high != null ? Math.min(high, value) : value
    return value
  }

  change_value(input_el: HTMLInputElement): void {
    const {value} = input_el
    const num = value != "" ? this.bound_value(Number(value)) : null

    if (num == null) {
      this.model.value = null
    } else if (!Number.isNaN(num)) {
      this.model.value = num
    }
  }

  filter_value(input_el: HTMLInputElement, input_filter: (value: string) => boolean): void {
    const {selectionStart: start, selectionEnd: end} = input_el
    if (!input_filter(input_el.value)) { // an invalid character is entered
      const difflen = this.old_value.length - input_el.value.length
      input_el.value = this.old_value
      if (start != null && end != null) {
        input_el.setSelectionRange(start-1, end + difflen)
      }
    } else {
      this.old_value = input_el.value
    }
  }
}

export namespace NumericInput {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    prefix: p.Property<string | null>
    suffix: p.Property<string | null>
    value: p.Property<number | null>
    placeholder: p.Property<string>
    mode: p.Property<"int" | "float">
    format: p.Property<string | TickFormatter | null>
    low: p.Property<number | null>
    high: p.Property<number | null>
  }
}

export interface NumericInput extends NumericInput.Attrs {}

export class NumericInput extends InputWidget {
  declare properties: NumericInput.Props
  declare __view_type__: NumericInputView

  constructor(attrs?: Partial<NumericInput.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = NumericInputView

    this.define<NumericInput.Props>(({Float, Str, Enum, Ref, Or, Nullable}) => ({
      prefix:      [ Nullable(Str), null ],
      suffix:      [ Nullable(Str), null ],
      value:       [ Nullable(Float), null ],
      placeholder: [ Str, "" ],
      mode:        [ Enum("int", "float"), "int" ],
      format:      [ Nullable(Or(Str, Ref(TickFormatter))), null ],
      low:         [ Nullable(Float), null ],
      high:        [ Nullable(Float), null ],
    }))
  }

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format)) {
      return numbro.format(value, format)
    } else {
      return format.doFormat([value], {loc: 0})[0]
    }
  }

  pretty(value: number): string {
    const format = this.properties.format.signal.value
    if (format != null) {
      return this._formatter(value, format)
    } else {
      return `${value}`
    }
  }
}
