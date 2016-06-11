_ = require "underscore"

ActionTool = require "./actions/action_tool"
HelpTool = require "./actions/help_tool"
GestureTool = require "./gestures/gesture_tool"
InspectTool = require "./inspectors/inspect_tool"

ToolbarBase = require "./toolbar_base"


class Toolbar extends ToolbarBase.Model
  type: 'Toolbar'
  default_view: ToolbarBase.View

  initialize: (attrs, options) ->
    super(attrs, options)
    @listenTo(@, 'change:tools', @_init_tools)
    @_init_tools()

  _init_tools: () ->
    for tool in @get('tools')
      if tool instanceof InspectTool.Model
        if not _.some(@inspectors, (t) => t.id == tool.id)
          @inspectors = @inspectors.concat([tool])
      else if tool instanceof HelpTool.Model
        if not _.some(@help, (t) => t.id == tool.id)
          @help = @help.concat([tool])
      else if tool instanceof ActionTool.Model
        if not _.some(@actions, (t) => t.id == tool.id)
          @actions = @actions.concat([tool])
      else if tool instanceof GestureTool.Model
        et = tool.event_type

        if et not of @gestures
          logger.warn("Toolbar: unknown event type '#{et}' for tool:
                      #{tool.type} (#{tool.id})")
          continue

        if not _.some(@gestures[et].tools, (t) => t.id == tool.id)
          @gestures[et].tools = @gestures[et].tools.concat([tool])
        @listenTo(tool, 'change:active', _.bind(@_active_change, tool))

    for et of @gestures
      tools = @gestures[et].tools
      if tools.length == 0
        continue
      @gestures[et].tools = _.sortBy(tools, (tool) -> tool.default_order)
      if et not in ['pinch', 'scroll']
        @gestures[et].tools[0].set('active', true)


module.exports =
  Model: Toolbar
