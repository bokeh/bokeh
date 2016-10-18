import {ButtonToolButtonView} from "./button_tool"

export class OnOffButtonView extends ButtonToolButtonView

  _clicked: () ->
    active = @model.active
    @model.active = not active
