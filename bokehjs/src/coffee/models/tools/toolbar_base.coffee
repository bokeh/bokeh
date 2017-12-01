import {logger} from "core/logging"
import {empty, div, a} from "core/dom"
import {build_views, remove_views} from "core/build_views"
import * as p from "core/properties"

import {DOMView} from "core/dom_view"
import {Model} from "model"

export class ToolbarBaseView extends DOMView

  initialize: (options) ->
    super(options)
    @_tool_button_views = {}
    @_build_tool_button_views()

  connect_signals: () ->
    super()
    @connect(@model.properties.tools.change, () => @_build_tool_button_views())

  remove: () ->
    remove_views(@_tool_button_views)
    super()

  _build_tool_button_views: () ->
    tools = @model._proxied_tools ? @model.tools # XXX
    build_views(@_tool_button_views, tools, {parent: @}, (tool) -> tool.button_view)

  render: () ->
    empty(@el)

    @el.classList.add("bk-toolbar")
    @el.classList.add("bk-toolbar-#{@model.toolbar_location}")

    if @model.logo?
      cls = if @model.logo == "grey" then "bk-grey" else null
      logo = a({href: "https://bokeh.pydata.org/", target: "_blank", class: ["bk-logo", "bk-logo-small", cls]})
      @el.appendChild(logo)

    bars = []

    gestures = @model.gestures
    for et of gestures
      buttons = []
      for tool in gestures[et].tools
        buttons.push(@_tool_button_views[tool.id].el)
      bars.push(buttons)

    buttons = []
    for tool in @model.actions
      buttons.push(@_tool_button_views[tool.id].el)
    bars.push(buttons)

    buttons = []
    for tool in @model.inspectors
      if tool.toggleable
        buttons.push(@_tool_button_views[tool.id].el)
    bars.push(buttons)

    buttons = []
    for tool in @model.help
      buttons.push(@_tool_button_views[tool.id].el)
    bars.push(buttons)

    for buttons in bars
      if buttons.length != 0
        bar = div({class: 'bk-button-bar'}, buttons)
        @el.appendChild(bar)

    return @

export class ToolbarBase extends Model
  type: 'ToolbarBase'
  default_view: ToolbarBaseView

  _active_change: (tool) ->
    event_types = tool.event_type

    if (typeof event_types is 'string')
      event_types = [event_types]

    for et in event_types
      if tool.active
        currently_active_tool = @gestures[et].active
        if currently_active_tool? and tool != currently_active_tool
          logger.debug("Toolbar: deactivating tool: #{currently_active_tool.type} (#{currently_active_tool.id}) for event type '#{et}'")
          currently_active_tool.active = false
        @gestures[et].active = tool
        logger.debug("Toolbar: activating tool: #{tool.type} (#{tool.id}) for event type '#{et}'")
      else
        @gestures[et].active = null

    return null

  @getters {
    horizontal: () ->
      return @toolbar_location == "above" or @toolbar_location == "below"
    vertical: () ->
      return @toolbar_location == "left" or @toolbar_location == "right"
  }

  @define {
    tools: [ p.Array,    []       ]
    logo:  [ p.String,   'normal' ] # TODO (bev)
  }

  @internal {
    gestures: [ p.Any, () -> {
      pan:       { tools: [], active: null }
      scroll:    { tools: [], active: null }
      pinch:     { tools: [], active: null }
      tap:       { tools: [], active: null }
      doubletap: { tools: [], active: null }
      press:     { tools: [], active: null }
      rotate:    { tools: [], active: null }
      multi:     { tools: [], active: null}
    } ]
    actions:    [ p.Array, [] ]
    inspectors: [ p.Array, [] ]
    help:       [ p.Array, [] ]
    toolbar_location: [ p.Location, 'right' ]
  }
