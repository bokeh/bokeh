import * as p from "core/properties"

import {ButtonTool, ButtonToolView} from "../button_tool"

export class InspectToolView extends ButtonToolView

export class InspectTool extends ButtonTool
  event_type: "move"

  @define {
    toggleable: [ p.Bool, true ]
  }

  @override {
    active: true
  }
