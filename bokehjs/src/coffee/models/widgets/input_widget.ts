import {Widget, WidgetView} from "./widget"
import * as p from "core/properties"

export class InputWidgetView extends WidgetView {
  model: InputWidget

  change_input(): void {
    if (this.model.callback != null)
      this.model.callback.execute(this.model)
  }
}

export class InputWidget extends Widget {

  static initClass() {
    this.prototype.type = "InputWidget"
    this.prototype.default_view = InputWidgetView

    this.define({
      title:    [ p.String, '' ],
      callback: [ p.Instance   ],
    })
  }

  title: string
  callback: any | null // TODO
}

InputWidget.initClass()
