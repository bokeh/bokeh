import * as p from "core/properties"
import {empty} from "core/dom"
import {any, sortBy} from "core/util/array"

import {ActionTool} from "./actions/action_tool"
import {HelpTool} from "./actions/help_tool"
import {GestureTool} from "./gestures/gesture_tool"
import {InspectTool} from "./inspectors/inspect_tool"
import {ToolbarBase} from "./toolbar_base"
import {ToolProxy} from "./tool_proxy"

import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {build_views, remove_views} from "core/build_views"

export class ProxyToolbar extends ToolbarBase
  type: 'ProxyToolbar'

  initialize: (options) ->
    super(options)
    @_init_tools()
    @_merge_tools()

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
        event_types = tool.event_type
        multi = true
        if (typeof event_types is 'string')
          event_types = [event_types]
          multi = false

        for et in event_types
          if et not of @gestures
            logger.warn("Toolbar: unknown event type '#{et}' for tool:
              #{tool.type} (#{tool.id})")
            continue

          if multi
            et = "multi"
          if not any(@gestures[et].tools, (t) => t.id == tool.id)
            @gestures[et].tools = @gestures[et].tools.concat([tool])

  _merge_tools: () ->
    # Go through all the tools on the toolbar and replace them with
    # a proxy e.g. PanTool, BoxSelectTool, etc.

    @_proxied_tools = []

    inspectors = {}
    actions = {}
    gestures = {}

    new_help_tools = []
    new_help_urls = []
    for helptool in @help
      if helptool.redirect not in new_help_urls
        new_help_tools.push(helptool)
        new_help_urls.push(helptool.redirect)
    @_proxied_tools.push(new_help_tools...)
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
    make_proxy = (tools, active=false) =>
      proxy = new ToolProxy({tools: tools, active: active})
      @_proxied_tools.push(proxy)
      return proxy

    for event_type of gestures
      @gestures[event_type].tools = []
      for tool_type, tools of gestures[event_type]
        if tools.length > 0
          proxy = make_proxy(tools)
          @gestures[event_type].tools.push(proxy)
          @connect(proxy.properties.active.change, @_active_change.bind(this, proxy))

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

export class ToolbarBoxView extends LayoutDOMView
  className: 'bk-toolbar-box'

  initialize: (options) ->
    super(options)
    @model.toolbar.toolbar_location = @model.toolbar_location
    @_toolbar_views = {}
    build_views(@_toolbar_views, [@model.toolbar], {parent: @})

  remove: () ->
    remove_views(@_toolbar_views)
    super()

  render: () ->
    super()

    toolbar = @_toolbar_views[@model.toolbar.id]
    toolbar.render()

    empty(@el)
    @el.appendChild(toolbar.el)

  get_width: () ->
    return if @model.toolbar.vertical then 30 else return null

  get_height: () ->
    return if @model.toolbar.horizontal then 30 else return null

export class ToolbarBox extends LayoutDOM
  type: 'ToolbarBox'
  default_view: ToolbarBoxView

  @define {
    toolbar: [ p.Instance ]
    toolbar_location: [ p.Location, "right" ]
  }

  @getters {
    # XXX: we are overriding LayoutDOM.sizing_mode here. That's a bad
    # hack, but currently every layoutable is allowed to have its
    # sizing mode configured, which is wrong. Another example of this
    # is PlotCanvas which only works with strech_both sizing mode.
    sizing_mode: () ->
      switch @toolbar_location
        when "above", "below"
          return "scale_width"
        when "left", "right"
          return "scale_height"
  }
