import {OrientedControl, OrientedControlView} from "./oriented_control"
import {ButtonClick} from "core/bokeh_events"
import {ButtonType} from "core/enums"
import type {VNode} from "core/vdom"
import {UIComponent, cls} from "core/vdom"
import type {StyleSheetLike} from "core/stylesheets"
import type * as p from "core/properties"

import * as buttons_css from "styles/buttons.css"

import type {ReadonlySignal} from "@preact/signals"

export abstract class ToggleButtonGroupView extends OrientedControlView {
  declare readonly model: ToggleButtonGroup
  declare readonly signals: p.SignalsOf<ToggleButtonGroup.Props>

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), buttons_css.default]
  }

  readonly active_indices: ReadonlySignal<Set<number>>

  override component(): VNode {
    const {orientation, labels, button_type, disabled} = this.signals

    const buttons = labels.value.map((label, i) => {
      return (
        <button
          class={
            cls(
              buttons_css.btn,
              buttons_css[`btn_${button_type.value}` as const],
              this.active_indices.value.has(i) ? buttons_css.active : null,
            )
          }
          disabled={disabled}
          onClick={() => this.on_click(i)}>
          {label}
        </button>
      )
    })

    return (
      <UIComponent parent={this.resolved_props}>
        <div class={cls(buttons_css.btn_group, buttons_css[orientation.value])}>
          {buttons}
        </div>
      </UIComponent>
    )
  }

  abstract change_active(i: number): void

  protected on_click(i: number): void {
    this.change_active(i)
    this.model.trigger_event(new ButtonClick())
  }
}

export namespace ToggleButtonGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = OrientedControl.Props & {
    labels: p.Property<string[]>
    button_type: p.Property<ButtonType>
  }
}

export interface ToggleButtonGroup extends ToggleButtonGroup.Attrs {}

export abstract class ToggleButtonGroup extends OrientedControl {
  declare properties: ToggleButtonGroup.Props
  declare __view_type__: ToggleButtonGroupView

  constructor(attrs?: Partial<ToggleButtonGroup.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ToggleButtonGroup.Props>(({Str, List}) => ({
      labels:      [ List(Str), [] ],
      button_type: [ ButtonType, "default" ],
    }))
  }
}
