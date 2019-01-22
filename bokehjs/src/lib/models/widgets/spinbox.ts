import * as p from "core/properties"
import {empty, input, label} from 'core/dom'
import {InputWidget, InputWidgetView} from 'models/widgets/input_widget'


export class SpinBoxView extends InputWidgetView {
  model: SpinBox

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

    this.inputEl.append(this.model.value.toString())
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
    const new_value = Number(this.inputEl.value)
    this.model.value = Math.min(Math.max(new_value, this.model.low), this.model.high)
    if (this.model.value != new_value) {
      this.model.change.emit()
    }
    super.change_input()
  }
}


export namespace SpinBox {
  export interface Attrs extends InputWidget.Attrs {
    value: number
    low: number
    high: number
    step: number
  }
  export interface Props extends InputWidget.Props {}
}

export interface SpinBox extends SpinBox.Attrs {}

export class SpinBox extends InputWidget {

  static initClass(): void {
    this.prototype.type = "SpinBox"
    this.prototype.default_view = SpinBoxView

    this.define({
      value: [p.Number, 0],
      low: [p.Number],
      high: [p.Number],
      step: [p.Number, 1],
    })
  }
}

SpinBox.initClass()
