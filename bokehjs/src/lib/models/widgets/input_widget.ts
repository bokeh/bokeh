import {Widget, WidgetView} from "./widget"
import {CallbackLike} from "../callbacks/callback"

import {label} from "core/dom"
import * as p from "core/properties"

export abstract class InputWidgetView extends WidgetView {
  model: InputWidget

  protected label: HTMLLabelElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.title.change, () => {
      this.label.textContent = this.model.title
    })
  }

  render(): void {
    super.render()

    const {title} = this.model
    this.label = label({style: {display: title.length == 0 ? "none" : ""}}, title)
    this.el.appendChild(this.label)
  }

  change_input(): void {
    if (this.model.callback != null)
      this.model.callback.execute(this.model)
  }
}

export namespace InputWidget {
  export interface Attrs extends Widget.Attrs {
    title: string
    callback: CallbackLike<InputWidget> | null
  }

  export interface Props extends Widget.Props {
    title: p.Property<string>
    callback: p.Property<CallbackLike<InputWidget> | null>
  }
}

export interface InputWidget extends InputWidget.Attrs {}

export abstract class InputWidget extends Widget {
  properties: InputWidget.Props

  constructor(attrs?: Partial<InputWidget.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "InputWidget"

    this.define({
      title:    [ p.String, "" ],
      callback: [ p.Any        ],
    })

    this.override({
      width: 300,
    })
  }
}
InputWidget.initClass()
