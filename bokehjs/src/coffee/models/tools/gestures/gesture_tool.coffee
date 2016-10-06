import * as _ from "underscore"
import * as ButtonTool from "../button_tool"

class GestureToolButtonView extends ButtonTool.ButtonView

  _clicked: () ->
    active = @model.active
    @model.active = not active

class GestureToolView extends ButtonTool.View

class GestureTool extends ButtonTool.Model

  event_type: null
  default_order: null

export {
  GestureTool as Model
  GestureToolView as View
  GestureToolButtonView as ButtonView
}
