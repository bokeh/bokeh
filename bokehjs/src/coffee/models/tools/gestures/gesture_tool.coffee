import * as _ from "underscore"
import {ButtonTool, ButtonToolView, ButtonToolButtonView} from "../button_tool"

export class GestureToolButtonView extends ButtonToolButtonView

  _clicked: () ->
    active = @model.active
    @model.active = not active

export class GestureToolView extends ButtonToolView

export class GestureTool extends ButtonTool

  event_type: null
  default_order: null
