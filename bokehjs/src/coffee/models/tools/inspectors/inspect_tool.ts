import {ButtonTool, ButtonToolView} from "../button_tool"
import {OnOffButtonView} from "../on_off_button"

import * as p from "core/properties"

export class InspectToolView extends ButtonToolView {
  model: InspectTool
}

export class InspectTool extends ButtonTool {

  static initClass() {
    this.prototype.type = "InspectTool"

    this.prototype.button_view = OnOffButtonView

    this.define({
      toggleable: [ p.Bool, true ],
    })

    this.override({
      active: true,
    })
  }

  event_type = "move"
}

InspectTool.initClass()
