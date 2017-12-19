import {ButtonToolButtonView} from "./button_tool"

export class OnOffButtonView extends ButtonToolButtonView

  render: () ->
    super()
    if @model.active
      @el.classList.add('bk-active')
    else
      @el.classList.remove('bk-active')

  _clicked: () ->
    active = @model.active
    @model.active = not active
