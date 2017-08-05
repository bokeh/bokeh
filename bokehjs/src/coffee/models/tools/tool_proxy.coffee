import * as p from "core/properties"
import {Signal} from "core/signaling"
import {Model} from "../../model"

export class ToolProxy extends Model
  # Operates all the tools given only one button

  initialize: (options) ->
    super(options)
    @do = new Signal(this, "do")
    @connect(@do, () -> @doit())
    @connect(@properties.active.change, () -> @set_active())

  doit: () ->
    for tool in @tools
      tool.do.emit()
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
