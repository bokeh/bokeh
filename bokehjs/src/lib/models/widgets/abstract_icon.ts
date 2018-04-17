import {Widget, WidgetView} from "./widget"

export abstract class AbstractIconView extends WidgetView {
  model: AbstractIcon
}

export namespace AbstractIcon {
  export interface Attrs extends Widget.Attrs {}

  export interface Props extends Widget.Props {}
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
