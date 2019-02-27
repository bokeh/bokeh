import {Widget, WidgetView} from "./widget"
import {SizingPolicy} from "core/layout"
import * as p from "core/properties"

export abstract class ControlView extends WidgetView {
  model: Control

  protected _height_policy(): SizingPolicy {
    return "fixed"
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
