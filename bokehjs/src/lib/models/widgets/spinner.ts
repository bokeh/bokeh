import {InputWidget, InputWidgetView} from "models/widgets/input_widget"
import {input} from "core/dom"
import * as p from "core/properties"

import {bk_input} from "styles/widgets/inputs"

const {abs, floor, log10} = Math

function _get_sig_dig(num: number) : number {
  let x = abs(Number(String(num).replace(".", ""))) // remove decimal and make positive
  if (x == 0) return 0
  while (x != 0 && (x % 10 == 0)) x /= 10 // kill the 0s at the end of n

  return floor(log10(x)) + 1 // get number of digits
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
      this.input_el.value = value.toFixed(_get_sig_dig(step))
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
    const {step} = this.model
    const new_value = Number(this.input_el.value)
    this.model.value = Number(new_value.toFixed(_get_sig_dig(step)))

    if (this.model.value != new_value) {
      // this is needed when the current value in the input is already at bounded value
      // and we enter a value outside these bounds. We emit a model change to update
      // the input text value.
      this.model.change.emit()
    }
    super.change_input()
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

  static initClass(): void {
    this.prototype.default_view = SpinnerView

    this.define<Spinner.Props>({
      value: [ p.Number, 0    ],
      low:   [ p.Number, null ],
      high:  [ p.Number, null ],
      step:  [ p.Number, 1    ],
    })
  }
}
Spinner.initClass()
