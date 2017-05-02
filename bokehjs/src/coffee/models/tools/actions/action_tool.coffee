import {ButtonTool, ButtonToolView, ButtonToolButtonView} from "../button_tool"
import {Signal} from "core/signaling"

export class ActionToolButtonView extends ButtonToolButtonView

  _clicked: () ->
    @model.trigger('do')

export class ActionToolView extends ButtonToolView

  initialize: (options) ->
    super(options)
    @listenTo(@model, 'do', @do)

export class ActionTool extends ButtonTool

  initialize: (attrs, options) ->
    super(attrs, options)
    @do = new Signal(this, "do")
