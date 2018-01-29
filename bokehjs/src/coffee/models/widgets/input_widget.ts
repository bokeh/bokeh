import {Widget, WidgetView} from "./widget"
import * as p from "core/properties"

export class InputWidgetView extends WidgetView {
  model: InputWidget

  change_input(): void {
    if (this.model.callback != null)
      this.model.callback.execute(this.model)
  }
}

export namespace InputWidget {
  export interface Attrs extends Widget.Attrs {
    title: string
    callback: any | null // TODO
  }

  export interface Opts extends Widget.Opts {}
}

export interface InputWidget extends InputWidget.Attrs {}

export class InputWidget extends Widget {

  constructor(attrs?: Partial<InputWidget.Attrs>, opts?: InputWidget.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "InputWidget"
    this.prototype.default_view = InputWidgetView

    this.define({
      title:    [ p.String, '' ],
      callback: [ p.Instance   ],
    })
  }
}

InputWidget.initClass()
