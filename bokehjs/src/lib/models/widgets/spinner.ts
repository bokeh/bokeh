import {InputWidget, InputWidgetView} from "models/widgets/input_widget"
import {input} from "core/dom"
import * as p from "core/properties"

const {floor} = Math

export class SpinnerView extends InputWidgetView {
  model: Spinner
  protected virtual_min: number | null = null
  protected virtual_max: number | null = null
  protected input_el: HTMLInputElement

  compute_virtual_bounds(): void{
    if(this.model.low){
      const n_steps = floor((this.model.value-this.model.low)/this.model.step)
      this.virtual_min = Number((this.model.value - n_steps*this.model.step).toFixed(14))
    }
    if(this.model.high){
      const n_steps = floor((this.model.high-this.model.value)/this.model.step)
      this.virtual_max = Number((this.model.value + n_steps*this.model.step).toFixed(14))
    }
  }

  render(): void {
    super.render()
    this.compute_virtual_bounds()
    this.input_el = input({
      type: "number",
      class: "bk-input",
      name: this.model.name,
      min: this.virtual_min,
      max: this.virtual_max,
      value: this.model.value,
      step: this.model.step,
      disabled: this.model.disabled,
    })
    this.input_el.addEventListener("change", () => this.change_input())
    this.group_el.appendChild(this.input_el)
  }

  change_input(): void {
    let new_value = Number(this.input_el.value)
    if(this.model.low && new_value<this.model.low){
      new_value = this.virtual_min!
      this.input_el.value = this.input_el.min
    }
    if(this.model.high && new_value>this.model.high){
      new_value = this.virtual_max!
      this.input_el.value = this.input_el.max
    }
    this.model.value = new_value
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
