import {AbstractButton, AbstractButtonView} from "./abstract_button"
import {ButtonClick} from "core/bokeh_events"

import * as p from "core/properties"

export class ButtonView extends AbstractButtonView {
  model: Button

  click(): void {
    this.model.clicks = this.model.clicks + 1
    this.model.trigger_event(new ButtonClick())
    super.click()
  }
}

export namespace Button {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractButton.Props & {
    clicks: p.Property<number>
  }
}

export interface Button extends Button.Attrs {}

export class Button extends AbstractButton {
  properties: Button.Props

  constructor(attrs?: Partial<Button.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.default_view = ButtonView

    this.define<Button.Props>({
      clicks: [ p.Number, 0 ], // deprecated
    })

    this.override({
      label: "Button",
    })
  }
}
Button.initClass()
