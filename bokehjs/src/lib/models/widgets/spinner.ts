import * as p from "core/properties"
import {input} from 'core/dom'
import {InputWidget, InputWidgetView} from 'models/widgets/input_widget'

function log10(x: number): number {
  if (Math.log10) {
    return Math.log10(x)
  } else {
    return Math.log(x) * Math.LOG10E
  }
}

export class SpinnerView extends InputWidgetView {
  model: Spinner

  protected input: HTMLInputElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.name.change, () => this.input.name = this.model.name || "")
    this.connect(this.model.properties.low.change, () => this.input.min = this.model.low.toFixed(log10(1 / this.model.step)))
    this.connect(this.model.properties.high.change, () => this.input.max = this.model.high.toFixed(log10(1 / this.model.step)))
    this.connect(this.model.properties.step.change, () => this.input.step = this.model.value.toFixed(log10(1 / this.model.step)))
    this.connect(this.model.properties.value.change, () => this.input.value = this.model.value.toFixed(log10(1 / this.model.step)))
    this.connect(this.model.properties.disabled.change, () => this.input.disabled = this.model.disabled)
  }

  render(): void {
    super.render()

    this.input = input({
      type: "number",
      class: "bk-input",
      name: this.model.name,
      min: this.model.low,
      max: this.model.high,
      value: this.model.value,
      step: this.model.step,
      disabled: this.model.disabled,
    })
    this.input.addEventListener("change", () => this.change_input())
    //this.input.addEventListener("input", () => this.change_input())
    this.el.appendChild(this.input)
  }

  change_input(): void {
    const {step, low, high} = this.model
    const new_value = Number(this.input.value)
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
    this.model.value = Number(process_value.toFixed(log10(1 / step)))

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
  export interface Props extends InputWidget.Props {
    value: p.Property<number>
    low: p.Property<number>
    high: p.Property<number>
    step: p.Property<number>
  }
}

export interface Spinner extends Spinner.Attrs {}

export class Spinner extends InputWidget {

  properties: Spinner.Props

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
