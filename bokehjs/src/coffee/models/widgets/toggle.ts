/* XXX: partial */
import * as p from "core/properties"

import {AbstractButton, AbstractButtonView} from "./abstract_button"

export class ToggleView extends AbstractButtonView {
  model: Toggle

  render(): void {
    super.render()
    if (this.model.active)
      this.buttonEl.classList.add("bk-bs-active")
  }

  change_input(): void {
    this.model.active = !this.model.active
    super.change_input()
  }
}

export namespace Toggle {
  export interface Attrs extends AbstractButton.Attrs {
    active: boolean
  }
}

export interface Toggle extends Toggle.Attrs {}

export class Toggle extends AbstractButton {

  constructor(attrs?: Partial<Toggle.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Toggle"
    this.prototype.default_view = ToggleView

    this.define({
      active: [ p. Bool, false ],
    })

    this.override({
      label: "Toggle",
    })
  }
}

Toggle.initClass()
