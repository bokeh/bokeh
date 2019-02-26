import {InputWidget, InputWidgetView} from "models/widgets/input_widget"
import {input} from "core/dom"
import * as p from "core/properties"

const {log10, round, min, max} = Math

export class SpinnerView extends InputWidgetView {
  model: Spinner

  protected input_el: HTMLInputElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.low.change, () => {
      const {low, step} = this.model
      if (low != null)
        this.input_el.min = low.toFixed(log10(1 / step))
    })
    this.connect(this.model.properties.high.change, () => {
      const {high, step} = this.model
      if (high != null)
        this.input_el.max = high.toFixed(log10(1 / step))
    })
    const fn = () => {
      const {value, step} = this.model
      this.input_el.step = value.toFixed(log10(1 / step))
    }
    this.connect(this.model.properties.step.change, fn)
    this.connect(this.model.properties.value.change, fn)
    this.connect(this.model.properties.disabled.change, () => {
      this.input_el.disabled = this.model.disabled
    })
  }

  render(): void {
    super.render()

    this.input_el = input({
      type: "number",
      class: "bk-input",
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
    const {step, low, high} = this.model
    const new_value = Number(this.input_el.value)

    let process_value: number
    if (low != null)
      process_value = low + step * round((new_value - low) / step)
    else
      process_value = round(new_value / step) * step

    if (low != null)
      process_value = max(process_value, low)

    if (high != null)
      process_value = min(process_value, high)

    this.model.value = Number(process_value.toFixed(log10(1 / step)))

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
    low: p.Property<number | null>
    high: p.Property<number | null>
    step: p.Property<number>
  }
}

export interface Spinner extends Spinner.Attrs {}

export class Spinner extends InputWidget {
  properties: Spinner.Props

  constructor(attrs?: Partial<Spinner.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Spinner"
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
