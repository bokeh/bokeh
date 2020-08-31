import {InputWidget, InputWidgetView} from "models/widgets/input_widget"
import {Color} from "core/types"
import {input} from "core/dom"
import * as p from "core/properties"

import {bk_input} from "styles/widgets/inputs"

export class ColorPickerView extends InputWidgetView {
  model: ColorPicker

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.name.change, () => this.input_el.name = this.model.name ?? "")
    this.connect(this.model.properties.color.change, () => this.input_el.value = this.model.color)
    this.connect(this.model.properties.disabled.change, () => this.input_el.disabled = this.model.disabled)
  }

  render(): void {
    super.render()

    this.input_el = input({
      type: "color",
      class: bk_input,
      name: this.model.name,
      value: this.model.color,
      disabled: this.model.disabled,
    })
    this.input_el.addEventListener("change", () => this.change_input())
    this.group_el.appendChild(this.input_el)
  }

  change_input(): void {
    this.model.color = this.input_el.value
    super.change_input()
  }
}

export namespace ColorPicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    color: p.Property<Color>
  }
}

export interface ColorPicker extends ColorPicker.Attrs {}

export class ColorPicker extends InputWidget {
  properties: ColorPicker.Props
  __view_type__: ColorPickerView

  constructor(attrs?: Partial<ColorPicker.Attrs>) {
    super(attrs)
  }

  static init_ColorPicker(): void {
    this.prototype.default_view = ColorPickerView

    this.define<ColorPicker.Props>(({Color}) => ({
      color: [ Color, "#000000" ],
    }))
  }
}
