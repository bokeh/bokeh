_ = require "underscore"
p = require "../../core/properties"

ActionTool = require "./actions/action_tool"
HelpTool = require "./actions/help_tool"
GestureTool = require "./gestures/gesture_tool"
InspectTool = require "./inspectors/inspect_tool"
ToolbarBase = require "./toolbar_base"
{ToolProxy} = require "./tool_proxy"

Box = require "../layouts/box"


class ToolbarBoxToolbar extends ToolbarBase.Model
  type: 'ToolbarBoxToolbar'
  default_view: ToolbarBase.View

  initialize: (options) ->
    super(options)
    @_init_tools()
    if @merge_tools is true
      @_merge_tools()

  @define {
    merge_tools: [ p.Bool, true ]
  }

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
        if not _.some(@gestures[et].tools, (t) => t.id == tool.id)
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
      if not _.contains(new_help_urls, helptool.redirect)
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
          @listenTo(proxy, 'change:active', _.bind(@_active_change, proxy))

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
      @gestures[et].tools = _.sortBy(tools, (tool) -> tool.default_order)
      if et not in ['pinch', 'scroll']
        @gestures[et].tools[0].set('active', true)


class ToolbarBoxView extends Box.View
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


class ToolbarBox extends Box.Model
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


module.exports =
  Model: ToolbarBox
  View: ToolbarBoxView
