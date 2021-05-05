import {Widget, WidgetView} from "./widget"
import {toggle_attribute} from "core/dom"
import * as p from "core/properties"

export abstract class ControlView extends WidgetView {
  override model: Control

  abstract controls(): Iterable<HTMLElement & {disabled: boolean}>

  override connect_signals(): void {
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
  override properties: Control.Props
  override __view_type__: ControlView

  constructor(attrs?: Partial<Control.Attrs>) {
    super(attrs)
  }
}
