import {InputWidget, InputWidgetView} from "models/widgets/input_widget"
import type {Color} from "core/types"
import {input} from "core/dom"
import type * as p from "core/properties"
import {color2hexrgb} from "core/util/color"

import * as inputs from "styles/widgets/inputs.css"

export class ColorPickerView extends InputWidgetView {
  declare model: ColorPicker

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.name.change, () => this.input_el.name = this.model.name ?? "")
    this.connect(this.model.properties.color.change, () => this.input_el.value = color2hexrgb(this.model.color))
    this.connect(this.model.properties.disabled.change, () => this.input_el.disabled = this.model.disabled)
  }

  protected _render_input(): HTMLElement {
    return this.input_el = input({
      type: "color",
      class: inputs.input,
      name: this.model.name,
      value: color2hexrgb(this.model.color),
      disabled: this.model.disabled,
    })
  }

  override render(): void {
    super.render()
    this.input_el.addEventListener("change", () => this.change_input())
  }

  override change_input(): void {
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
  declare properties: ColorPicker.Props
  declare __view_type__: ColorPickerView

  constructor(attrs?: Partial<ColorPicker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ColorPickerView

    this.define<ColorPicker.Props>(({Color}) => ({
      color: [ Color, "#000000" ],
    }))
  }
}
