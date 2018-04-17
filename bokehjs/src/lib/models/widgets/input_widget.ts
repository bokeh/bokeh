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

  export interface Props extends Widget.Props {
    title: p.Property<string>
  }
}

export interface InputWidget extends InputWidget.Attrs {}

export class InputWidget extends Widget {

  properties: InputWidget.Props

  constructor(attrs?: Partial<InputWidget.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "InputWidget"
    this.prototype.default_view = InputWidgetView

    this.define({
      title:    [ p.String, '' ],
      callback: [ p.Instance   ],
    })
  }
}

InputWidget.initClass()
