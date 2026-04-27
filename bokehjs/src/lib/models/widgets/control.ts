import {Widget, WidgetView} from "./widget"
import {toggle_attribute} from "core/dom"
import type * as p from "core/properties"

/** @deprecated */
export abstract class ControlView extends WidgetView {
  declare model: Control

  /** @deprecated */
  controls?(): Iterable<HTMLElement & {disabled: boolean}>

  override connect_signals(): void {
    super.connect_signals()

    this.connect(this.disabled, (disabled) => {
      if (this.controls != null) {
        for (const el of this.controls()) {
          toggle_attribute(el, "disabled", disabled)
        }
      }
    })
  }
}

/** @deprecated */
export namespace Control {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props
}

/** @deprecated */
export interface Control extends Control.Attrs {}

/** @deprecated */
export abstract class Control extends Widget {
  declare properties: Control.Props
  declare __view_type__: ControlView

  constructor(attrs?: Partial<Control.Attrs>) {
    super(attrs)
  }
}
