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

export class Toggle extends AbstractButton {
}

Toggle.prototype.type = "Toggle"
Toggle.prototype.default_view = ToggleView

Toggle.define({
  active: [ p. Bool, false ]
})

Toggle.override({
  label: "Toggle"
})
