import {Widget, WidgetView} from "./widget"

export abstract class AbstractIconView extends WidgetView {
  model: AbstractIcon
}

export abstract class AbstractIcon extends Widget {
  static initClass() {
    this.prototype.type = "AbstractIcon"
  }
}

AbstractIcon.initClass()
