import {Widget, WidgetView} from "./widget"
import * as p from "core/properties"

export abstract class AbstractIconView extends WidgetView {
  model: AbstractIcon
}

export namespace AbstractIcon {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props
}

export interface AbstractIcon extends AbstractIcon.Attrs {}

export abstract class AbstractIcon extends Widget {
  properties: AbstractIcon.Props

  constructor(attrs?: Partial<AbstractIcon.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "AbstractIcon"
  }
}
AbstractIcon.initClass()
