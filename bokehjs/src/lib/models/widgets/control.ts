import {Widget, WidgetView} from "./widget"
import {toggle_attribute} from "core/dom"
import type * as p from "core/properties"

export abstract class ControlView extends WidgetView {
  declare model: Control

  abstract controls(): Iterable<HTMLElement & {disabled: boolean}>

  override connect_signals(): void {
    super.connect_signals()

    this.connect(this.disabled, (disabled) => {
      for (const el of this.controls()) {
        toggle_attribute(el, "disabled", disabled)
      }
    })
  }
}

export namespace Control {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props
}

export interface Control extends Control.Attrs {}

export abstract class Control extends Widget {
  declare properties: Control.Props
  declare __view_type__: ControlView

  constructor(attrs?: Partial<Control.Attrs>) {
    super(attrs)
  }
}
