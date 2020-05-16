import {Widget, WidgetView} from "./widget"
import {toggle_attribute} from "core/dom"
import * as p from "core/properties"

export abstract class ControlView extends WidgetView {
  model: Control

  abstract controls(): Iterable<HTMLElement & {disabled: boolean}>

  connect_signals(): void {
    super.connect_signals()

    const p = this.model.properties
    this.on_change(p.disabled, () => {
      for (const el of this.controls()) {
        toggle_attribute(el, "disabled", this.model.disabled)
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
  properties: Control.Props
  __view_type__: ControlView

  constructor(attrs?: Partial<Control.Attrs>) {
    super(attrs)
  }
}
