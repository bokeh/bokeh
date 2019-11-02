import {InputWidget, InputWidgetView} from "models/widgets/input_widget"
import {input} from "core/dom"
import * as p from "core/properties"

import {bk_input} from "styles/widgets/inputs"

const {floor, max, min} = Math

function _get_sig_dig(num: number): number { // get number of digits
  if (floor(num) !== num)
    return num.toString().replace('/0+$/', '').split(".")[1].length
  return 0
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
      this.input_el.step = step.toFixed(16)
    })
    this.connect(this.model.properties.value.change, () => {
      const {value, step} = this.model
      this.input_el.value = value.toFixed(_get_sig_dig(step)).replace(/(\.[0-9]*[1-9])0+$|\.0*$/, '$1') //trim last 0
    })
    this.connect(this.model.properties.disabled.change, () => {
      this.input_el.disabled = this.model.disabled
    })
  }

  render(): void {
    super.render()

    this.input_el = input({
      type: "number",
      class: bk_input,
      name: this.model.name,
      min: this.model.low,
      max: this.model.high,
      value: this.model.value,
      step: this.model.step,
      disabled: this.model.disabled,
    })
    this.input_el.addEventListener("change", () => this.change_input())
    //this.input_el.addEventListener("input", () => this.change_input())
    this.group_el.appendChild(this.input_el)
  }

  change_input(): void {
    if (this.input_el.value){ //if input is empty skip update
      const {step} = this.model
      let new_value = Number(this.input_el.value)
      if (this.model.low != null)
        new_value = max(new_value, this.model.low)
      if (this.model.high != null)
        new_value = min(new_value, this.model.high)
      this.model.value = Number(new_value.toFixed(_get_sig_dig(step)))
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
    step:  p.Property<number>
  }
}

export interface Spinner extends Spinner.Attrs {}

export class Spinner extends InputWidget {
  properties: Spinner.Props

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
