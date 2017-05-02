import * as p from "core/properties"
import {Signal} from "core/signaling"
import {Model} from "../../model"

export class ToolProxy extends Model
  # Operates all the tools given only one button

  initialize: (options) ->
    super(options)
    @do = new Signal(this, "do")

  do: () ->
    for tool in @tools
      tool.trigger('do')
    return null

  set_active: () ->
    for tool in @tools
      tool.active = @active
    return null

  @define {
    tools: [ p.Array, [] ]
    active: [ p.Bool, false ]
    tooltip: [ p.String ]
    tool_name: [ p.String ]
    disabled: [ p.Bool, false ]
    event_type: [ p.String ]
    icon: [ p.String ]
  }

  _clicked: () ->
    active = @model.active
    @model.active = not active
