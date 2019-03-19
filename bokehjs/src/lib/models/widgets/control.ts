import {Widget, WidgetView} from "./widget"
import * as p from "core/properties"

export abstract class ControlView extends WidgetView {
  model: Control

  connect_signals(): void {
    super.connect_signals()

    const p = this.model.properties
    this.on_change(p.disabled, () => this.render())
  }
}

export namespace Control {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props
}

export interface Control extends Control.Attrs {}

export abstract class Control extends Widget {
  properties: Control.Props

  constructor(attrs?: Partial<Control.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Control"
  }
}
Control.initClass()
