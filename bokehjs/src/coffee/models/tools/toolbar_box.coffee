import * as p from "core/properties"
import {any, sortBy} from "core/util/array"

import {ActionTool} from "./actions/action_tool"
import {HelpTool} from "./actions/help_tool"
import {GestureTool} from "./gestures/gesture_tool"
import {InspectTool} from "./inspectors/inspect_tool"
import {ToolbarBase, ToolbarBaseView} from "./toolbar_base"
import {ToolProxy} from "./tool_proxy"

import {Box, BoxView} from "../layouts/box"

export class ToolbarBoxToolbar extends ToolbarBase
  type: 'ToolbarBoxToolbar'
  default_view: ToolbarBaseView

  initialize: (options) ->
    super(options)
    @_init_tools()
    if @merge_tools is true
      @_merge_tools()

  @define {
    merge_tools: [ p.Bool, true ]
  }

  _init_tools: () ->
    for tool in @tools
      if tool instanceof InspectTool
        if not any(@inspectors, (t) => t.id == tool.id)
          @inspectors = @inspectors.concat([tool])
      else if tool instanceof HelpTool
        if not any(@help, (t) => t.id == tool.id)
          @help = @help.concat([tool])
      else if tool instanceof ActionTool
        if not any(@actions, (t) => t.id == tool.id)
          @actions = @actions.concat([tool])
      else if tool instanceof GestureTool
        et = tool.event_type
        if not any(@gestures[et].tools, (t) => t.id == tool.id)
          @gestures[et].tools = @gestures[et].tools.concat([tool])

  _merge_tools: () ->

    # Go through all the tools on the toolbar and replace them with
    # a proxy e.g. PanTool, BoxSelectTool, etc.

    inspectors = {}
    actions = {}
    gestures = {}

    new_help_tools = []
    new_help_urls = []
    for helptool in @help
      if helptool.redirect not in new_help_urls
        new_help_tools.push(helptool)
        new_help_urls.push(helptool.redirect)
    @help = new_help_tools

    for event_type, info of @gestures
      if event_type not of gestures
        gestures[event_type] = {}
      for tool in info.tools
        if tool.type not of gestures[event_type]
          gestures[event_type][tool.type] = []
        gestures[event_type][tool.type].push(tool)

    for tool in @inspectors
      if tool.type not of inspectors
        inspectors[tool.type] = []
      inspectors[tool.type].push(tool)

    for tool in @actions
      if tool.type not of actions
        actions[tool.type] = []
      actions[tool.type].push(tool)

    # Add a proxy for each of the groups of tools.
    make_proxy = (tools, active=false) ->
      return new ToolProxy({
        tools: tools,
        event_type: tools[0].event_type,
        tooltip: tools[0].tool_name
        tool_name: tools[0].tool_name
        icon: tools[0].icon
        active: active
      })

    for event_type of gestures
      @gestures[event_type].tools = []
      for tool_type, tools of gestures[event_type]
        if tools.length > 0
          proxy = make_proxy(tools)
          @gestures[event_type].tools.push(proxy)
          @listenTo(proxy, 'change:active', @_active_change.bind(proxy))

    @actions = []
    for tool_type, tools of actions
      if tools.length > 0
        @actions.push(make_proxy(tools))

    @inspectors = []
    for tool_type, tools of inspectors
      if tools.length > 0
        @inspectors.push(make_proxy(tools, active=true))

    for et of @gestures
      tools = @gestures[et].tools
      if tools.length == 0
        continue
      @gestures[et].tools = sortBy(tools, (tool) -> tool.default_order)
      if et not in ['pinch', 'scroll']
        @gestures[et].tools[0].active = true


export class ToolbarBoxView extends BoxView
  className: 'bk-toolbar-box'

  get_width: () ->
    if @model._horizontal is true
      return 30
    else
      return null

  get_height: () ->
    # Returning null from this causes
    # Left toolbar to overlap in scale_width case
    return 30


export class ToolbarBox extends Box
  type: 'ToolbarBox'
  default_view: ToolbarBoxView

  initialize: (options) ->
    super(options)
    @_toolbar = new ToolbarBoxToolbar(options)
    if @toolbar_location in ['left', 'right']
      @_horizontal = true
      @_toolbar._sizeable = @_toolbar._width
    else
      @_horizontal = false
      @_toolbar._sizeable = @_toolbar._height

  _doc_attached: () ->
    @_toolbar.attach_document(@document)

  get_layoutable_children: () ->
    return [@_toolbar]

  @define {
    toolbar_location: [ p.Location, "right"  ]
    merge_tools:      [ p.Bool,     true     ]
    tools:            [ p.Any,      []       ]
    logo:             [ p.String,   "normal" ]
  }
