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
}

InputWidget.prototype.type = "InputWidget"
InputWidget.prototype.default_view = InputWidgetView

InputWidget.define({
  callback: [ p.Instance   ],
  title:    [ p.String, '' ],
})
