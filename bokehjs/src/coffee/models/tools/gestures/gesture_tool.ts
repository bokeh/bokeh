import {ButtonTool, ButtonToolView} from "../button_tool"
import {OnOffButtonView} from "../on_off_button"

export abstract class GestureToolView extends ButtonToolView {
  model: GestureTool
}

export abstract class GestureTool extends ButtonTool {
  button_view = OnOffButtonView

  event_type: string
  default_order: number
}

GestureTool.prototype.type = "GestureTool"
