import * as p from "core/properties"
import {empty, input, label} from 'core/dom'
import {InputWidget, InputWidgetView} from 'models/widgets/input_widget'

function log10(x: number): number{
  if (Math.log10) {
    return Math.log10(x)
  } else {
    return Math.log(x) * Math.LOG10E
  }
}

export class SpinnerView extends InputWidgetView {
  model: Spinner

  protected inputEl: HTMLInputElement

  initialize(options: any): void {
    super.initialize(options)
    this.render()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  render(): void {
    super.render()

    empty(this.el)

    const labelEl = label({for: this.model.id}, this.model.title)
    this.el.appendChild(labelEl)

    this.inputEl = input({
      class: "bk-widget-form-input",
      id: this.model.id,
      name: this.model.name,
      min: this.model.low,
      max: this.model.high,
      value: this.model.value,
      step: this.model.step,
      disabled: this.model.disabled,
      type: "number",
    })
    this.inputEl.addEventListener("change", () => this.change_input())
    this.el.appendChild(this.inputEl)

    // TODO - This 35 is a hack we should be able to compute it
    if (this.model.width)
      this.inputEl.style.width = `${this.model.width - 35}px`

    // TODO - This 35 is a hack we should be able to compute it
    if (this.model.height)
      this.inputEl.style.height = `${this.model.height - 35}px`
  }

  change_input(): void {
    const {step, low, high} = this.model
    const new_value = Number(this.inputEl.value)
    let process_value
    if (low != null) {
      process_value = low + step * Math.round((new_value - low) / step)
    } else {
      process_value = Math.round(new_value / step) * step
    }
    if (low != null) {
      process_value = Math.max(process_value, low)
    }
    if (high != null) {
      process_value = Math.min(process_value, high)
    }
    this.model.value = Number(process_value.toFixed(log10(1/step)))

    if (this.model.value != new_value) {
      //this is needeed when the current value in the intput is already at bounded value
      //and we enter a value outside these bounds. We emit a model change to update
      //the input text value
      this.model.change.emit()
    }
    super.change_input()
  }
}


export namespace Spinner {
  export interface Attrs extends InputWidget.Attrs {
    value: number
    low: number
    high: number
    step: number
  }
  export interface Props extends InputWidget.Props {}
}

export interface Spinner extends Spinner.Attrs {}

export class Spinner extends InputWidget {

  static initClass(): void {
    this.prototype.type = "Spinner"
    this.prototype.default_view = SpinnerView

    this.define({
      value: [p.Number, 0],
      low: [p.Number],
      high: [p.Number],
      step: [p.Number, 1],
    })
  }
}

Spinner.initClass()
