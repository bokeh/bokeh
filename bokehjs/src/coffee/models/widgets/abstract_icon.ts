import {Widget, WidgetView} from "./widget"

export abstract class AbstractIconView extends WidgetView {
  model: AbstractIcon
}

export abstract class AbstractIcon extends Widget {}

AbstractIcon.prototype.type = "AbstractIcon"
