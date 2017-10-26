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

  _clicked: () ->
    active = @model.active
    @model.active = not active

  @getters {
    button_view: () -> @tools[0].button_view
    event_type:  () -> @tools[0].event_type
    tooltip:     () -> @tools[0].tool_name
    tool_name:   () -> @tools[0].tool_name
    icon:        () -> @tools[0].icon
  }

  @define {
    tools:    [ p.Array, []    ]
    active:   [ p.Bool,  false ]
    disabled: [ p.Bool,  false ]
  }
