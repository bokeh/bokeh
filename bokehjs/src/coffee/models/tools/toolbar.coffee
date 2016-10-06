import * as _ from "underscore"

import * as p from "../../core/properties"

import * as ActionTool from "./actions/action_tool"
import * as HelpTool from "./actions/help_tool"
import * as GestureTool from "./gestures/gesture_tool"
import * as InspectTool from "./inspectors/inspect_tool"

import * as ToolbarBase from "./toolbar_base"


class Toolbar extends ToolbarBase.Model
  type: 'Toolbar'
  default_view: ToolbarBase.View

  initialize: (attrs, options) ->
    super(attrs, options)
    @listenTo(@, 'change:tools', @_init_tools)
    @_init_tools()

  _init_tools: () ->
    for tool in @tools
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

      if et == 'tap'
        if @active_tap is null
          continue
        if @active_tap is 'auto'
          @gestures[et].tools[0].active = true
        else
          @active_tap.active = true

      if et == 'pan'
        if @active_drag is null
          continue
        if @active_drag is 'auto'
          @gestures[et].tools[0].active = true
        else
          @active_drag.active = true

      if et in ['pinch', 'scroll']
        if @active_scroll is null or @active_scroll is 'auto'
          continue
        @active_scroll.active = true

  @define {
      active_drag:   [ p.Any, 'auto' ]
      active_scroll: [ p.Any, 'auto' ]
      active_tap:    [ p.Any, 'auto' ]
  }

export {
  Toolbar as Model
}
