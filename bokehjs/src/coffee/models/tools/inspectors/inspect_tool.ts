import {ButtonTool, ButtonToolView} from "../button_tool"
import {OnOffButtonView} from "../on_off_button"

import * as p from "core/properties"

export class InspectToolView extends ButtonToolView {
  model: InspectTool
}

export class InspectTool extends ButtonTool {
  event_type = "move"
}

InspectTool.prototype.type = "InspectTool"

InspectTool.prototype.button_view = OnOffButtonView

InspectTool.define({
  toggleable: [ p.Bool, true ]
})

InspectTool.override({
  active: true
})
