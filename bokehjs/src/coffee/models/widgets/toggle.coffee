import * as p from "core/properties"

import {AbstractButton, AbstractButtonView} from "./abstract_button"

export class ToggleView extends AbstractButtonView

  render: () ->
    super()
    if @model.active
      @buttonEl.classList.add("bk-bs-active")
    return @

  change_input: () ->
    @model.active = not @model.active
    super()

export class Toggle extends AbstractButton
  type: "Toggle"
  default_view: ToggleView

  @define {
    active: [ p. Bool, false ]
  }

  @override {
    label: "Toggle"
  }
