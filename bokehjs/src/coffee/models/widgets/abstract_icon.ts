import {Widget, WidgetView} from "./widget"

export abstract class AbstractIconView extends WidgetView {
  model: AbstractIcon
}

export namespace AbstractIcon {
  export interface Attrs extends Widget.Attrs {}

  export interface Opts extends Widget.Opts {}
}

export interface AbstractIcon extends AbstractIcon.Attrs {}

export abstract class AbstractIcon extends Widget {

  constructor(attrs?: Partial<AbstractIcon.Attrs>, opts?: AbstractIcon.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "AbstractIcon"
  }
}

AbstractIcon.initClass()
