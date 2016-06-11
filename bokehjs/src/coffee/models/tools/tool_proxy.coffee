p = require "../../core/properties"
Model = require "../../model"


class ToolProxy extends Model
  # Operates all the tools given only one button

  initialize: (options) ->
    super(options)
    @listenTo(@, 'do', @do)
    @listenTo(@, 'change:active', @set_active)

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
    active = @model.get('active')
    @model.set('active', not active)

module.exports =
  ToolProxy: ToolProxy
