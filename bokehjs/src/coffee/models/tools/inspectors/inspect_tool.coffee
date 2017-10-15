import * as p from "core/properties"

import {ButtonTool, ButtonToolView} from "../button_tool"
import {OnOffButtonView} from "../on_off_button"

export class InspectToolView extends ButtonToolView

export class InspectTool extends ButtonTool
  button_view: OnOffButtonView

  event_type: "move"

  @define {
    toggleable: [ p.Bool, true ]
  }

  @override {
    active: true
  }
