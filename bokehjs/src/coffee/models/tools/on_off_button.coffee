import {ButtonToolButtonView} from "./button_tool"

export class OnOffButtonView extends ButtonToolButtonView

  render: () ->
    super()
    @$el.toggleClass('active', @model.active)

  _clicked: () ->
    active = @model.active
    @model.active = not active
