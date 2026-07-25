import {InputWidget, InputWidgetView} from "models/widgets/input_widget"
import type {VNode} from "core/vdom"
import {UIComponent} from "core/vdom"
import type {Color} from "core/types"
import type * as p from "core/properties"
import {color2hexrgb} from "core/util/color"

import * as inputs_css from "styles/widgets/inputs.css"

export class ColorPickerView extends InputWidgetView {
  declare readonly model: ColorPicker
  declare readonly signals: p.SignalsOf<ColorPicker.Props>
  declare readonly values: ColorPicker.Attrs

  /// TODO remove
  protected override _render_input(): HTMLElement {
    return undefined as any
  }
  ///

  override component(): VNode {
    const {name, color} = this.values
    const {disabled} = this.signals
    return (
      <UIComponent parent={this.resolved_props}>
        <div class={inputs_css.outer}>
          <div class={inputs_css.inner}>
            <input
              type="color"
              class={inputs_css.input}
              name={name ?? undefined}
              disabled={disabled}
              value={color2hexrgb(color)}
              onChange={(event) => this.model.color = event.currentTarget.value}/>
          </div>
        </div>
      </UIComponent>
    )
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
