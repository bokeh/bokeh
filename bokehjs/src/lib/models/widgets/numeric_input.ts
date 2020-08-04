import * as numbro from "@bokeh/numbro"

import { InputWidgetView, InputWidget } from "./input_widget"

import {input} from "core/dom"
import {assert} from "core/util/assert"
import * as p from "core/properties"

import {TickFormatter} from "api"
import {isString} from "api/linalg"

import {bk_input} from "styles/widgets/inputs"


const int_regex = /^[-+]?\d*$/
const float_regex = /^[-+]?\d*\.?\d*(?:(?:\d|\d.)[eE][-+]?)*\d*$/

export class NumericInputView extends InputWidgetView {
  model: NumericInput

  protected input_el: HTMLInputElement
  protected old_value: string

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.name.change, () => this.input_el.name = this.model.name || "")
    this.connect(this.model.properties.value.change, () => {
      this.input_el.value = this.format_value
      this.old_value = this.input_el.value
    })
    this.connect(this.model.properties.low.change, () => {
      const {value, low, high} = this.model
      if (low!=null && high!=null)
        assert(low<=high, "Invalid bounds, low must be inferior to high")
      if (value != null && low != null)
        this.model.value = Math.max(value, low)
    })
    this.connect(this.model.properties.high.change, () => {
      const {value, low, high} = this.model
      if (low!=null && high!=null)
        assert(high>=low, "Invalid bounds, high must be superior to low")
      if (value != null && high != null)
        this.model.value = Math.min(value, high)
    })
    this.connect(this.model.properties.high.change, () => this.input_el.placeholder = this.model.placeholder)
    this.connect(this.model.properties.disabled.change, () => this.input_el.disabled = this.model.disabled)
    this.connect(this.model.properties.placeholder.change, () => this.input_el.placeholder = this.model.placeholder)
  }

  get format_value(): string {
    return (this.model.value != null)? this.model.pretty(this.model.value): ""
  }

  _set_input_filter(inputFilter: (value: string) => boolean): void {
    this.input_el.addEventListener("input", () => {
      const {selectionStart, selectionEnd} = this.input_el
      if (!inputFilter(this.input_el.value)) { //an invalid character is entered
        const difflen = this.old_value.length - this.input_el.value.length
        this.input_el.value = this.old_value
        if (selectionStart && selectionEnd)
          this.input_el.setSelectionRange(selectionStart-1, selectionEnd+difflen)
      } else
        this.old_value = this.input_el.value
    })
  }

  render(): void {
    super.render()

    this.input_el = input({
      type: "text",
      class: bk_input,
      name: this.model.name,
      value: this.format_value,
      disabled: this.model.disabled,
      placeholder: this.model.placeholder,
    })
    this.old_value = this.format_value
    this.set_input_filter()
    this.input_el.addEventListener("change", () => this.change_input())
    this.input_el.addEventListener("focusout", () => this.input_el.value =  this.format_value)
    this.group_el.appendChild(this.input_el)
  }

  set_input_filter(): void {
    if (this.model.mode == "int")
      this._set_input_filter((value) => int_regex.test(value))
    else if (this.model.mode == "float")
      this._set_input_filter((value) => float_regex.test(value))
  }

  bound_value(value: number): number {
    let output = value
    const {low, high} = this.model
    output = (low != null)? Math.max(low, output): output
    output = (high != null)? Math.min(high, output): output
    return output
  }

  get value(): number | null {
    let value = (this.input_el.value!=="")? Number(this.input_el.value) : null
    if(value!=null) value = this.bound_value(value)
    return value
  }

  change_input(): void {
    if (this.value == null) this.model.value = null
    else if (!Number.isNaN(this.value)) this.model.value = this.value
  }
}


export namespace NumericInput {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
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
  properties: NumericInput.Props
  __view_type__: NumericInputView

  constructor(attrs?: Partial<NumericInput.Attrs>) {
    super(attrs)
  }

  static init_NumericInput(): void {
    this.prototype.default_view = NumericInputView

    this.define<NumericInput.Props>({
      value:       [ p.Number,  null ],
      placeholder: [ p.String,   ""  ],
      mode:        [ p.Any,    "int" ],
      format:      [ p.Any           ],
      low:         [ p.Number,  null ],
      high:        [ p.Number,  null ],
    })
  }

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format)){
      return numbro.format(value, format)
    } else {
      return format.doFormat([value], {loc: 0})[0]
    }
  }

  pretty(value: number): string {
    if(this.format!=null)
      return this._formatter(value, this.format)
    else
      return `${value}`
  }
}
