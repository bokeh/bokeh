import {InputWidget, InputWidgetView} from "models/widgets/input_widget"
import {input} from "core/dom"
import * as p from "core/properties"

import {bk_input} from "styles/widgets/inputs"

const {floor, max, min} = Math

function _get_sig_dig(num: number | null): number | null { // get number of digits
  if (num) {
    if (floor(num) !== num)
      return num.toFixed(16).replace(/0+$/, '').split(".")[1].length
    return 0
  } else {
    return null
  }
}

export class SpinnerView extends InputWidgetView {
  model: Spinner

  protected input_el: HTMLInputElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.low.change, () => {
      const {low} = this.model
      if (low != null)
        this.input_el.min = low.toFixed(16)
    })
    this.connect(this.model.properties.high.change, () => {
      const {high} = this.model
      if (high != null)
        this.input_el.max = high.toFixed(16)
    })
    this.connect(this.model.properties.step.change,  () => {
      const {step} = this.model
      this.input_el.step = (step != null)? step.toFixed(16): 'any'
    })
    this.connect(this.model.properties.value.change, () => {
      const {value} = this.model
      this.input_el.value = this._trim_last_zeros(this._value2str(value))
    })
    this.connect(this.model.properties.disabled.change, () => {
      this.input_el.disabled = this.model.disabled
    })
  }

  _value2str(value: number): string {
    const {step} = this.model
    const n_digits = _get_sig_dig(step)
    return (n_digits != null)? value.toFixed(n_digits): `${value}`
  }

  _trim_last_zeros(value: string): string {
    return value.replace(/(\.[0-9]*[1-9])0+$|\.0*$/, '$1')
  }

  render(): void {
    super.render()

    const {name, low: min, high: max, value, step, disabled} = this.model
    this.input_el = input({
      type: "number",
      class: bk_input,
      name,
      value,
      disabled,
      min,
      max,
      step: (step != null)? step: 'any',
    })
    this.input_el.addEventListener("change", () => this.change_input())
    //this.input_el.addEventListener("input", () => this.change_input())
    this.group_el.appendChild(this.input_el)
  }

  change_input(): void {
    if (this.input_el.value){ //if input is empty skip update
      let new_value = Number(this.input_el.value)
      if (this.model.low != null)
        new_value = max(new_value, this.model.low)
      if (this.model.high != null)
        new_value = min(new_value, this.model.high)
      this.model.value = Number(this._value2str(new_value))
      super.change_input()
    }
  }
}

export namespace Spinner {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value: p.Property<number>
    low:   p.Property<number | null>
    high:  p.Property<number | null>
    step:  p.Property<number | null>
  }
}

export interface Spinner extends Spinner.Attrs {}

export class Spinner extends InputWidget {
  properties: Spinner.Props
  __view_type__: SpinnerView

  constructor(attrs?: Partial<Spinner.Attrs>) {
    super(attrs)
  }

  static init_Spinner(): void {
    this.prototype.default_view = SpinnerView

    this.define<Spinner.Props>({
      value: [ p.Number, 0    ],
      low:   [ p.Number, null ],
      high:  [ p.Number, null ],
      step:  [ p.Number, 1    ],
    })
  }
}
