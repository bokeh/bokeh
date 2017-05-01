import {ButtonTool, ButtonToolView} from "../button_tool"

export class InspectToolView extends ButtonToolView

export class InspectTool extends ButtonTool
  event_type: "move"

  @override {
    active: true
  }
