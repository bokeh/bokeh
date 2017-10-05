import {logger} from "core/logging"
import {empty, div, a} from "core/dom"
import * as p from "core/properties"

import {DOMView} from "core/dom_view"
import {Model} from "model"

import {ActionToolButtonView} from "./actions/action_tool"
import {OnOffButtonView} from "./on_off_button"

export class ToolbarBaseView extends DOMView

  render: () ->
    empty(@el)

    @el.classList.add("bk-toolbar")
    @el.classList.add("bk-toolbar-#{@model.toolbar_location}")

    if @model.logo?
      cls = if @model.logo == "grey" then "bk-grey" else null
      logo = a({href: "https://bokeh.pydata.org/", target: "_blank", class: ["bk-logo", "bk-logo-small", cls]})
      @el.appendChild(logo)

    add_bar = (buttons) =>
      if buttons.length != 0
        bar = div({class: 'bk-button-bar'}, buttons)
        @el.appendChild(bar)

    gestures = @model.gestures
    for et of gestures
      buttons = []
      for obj in gestures[et].tools
        buttons.push(new OnOffButtonView({model: obj, parent: @}).el)
      add_bar(buttons)

    buttons = []
    for obj in @model.actions
      buttons.push(new ActionToolButtonView({model: obj, parent: @}).el)
    add_bar(buttons)

    buttons = []
    for obj in @model.inspectors
      if obj.toggleable
        buttons.push(new OnOffButtonView({model: obj, parent: @}).el)
    add_bar(buttons)

    buttons = []
    for obj in @model.help
      buttons.push(new ActionToolButtonView({model: obj, parent: @}).el)
    add_bar(buttons)

    return @

export class ToolbarBase extends Model
  type: 'ToolbarBase'
  default_view: ToolbarBaseView

  _active_change: (tool) =>
    event_type = tool.event_type

    if tool.active
      # Toggle between tools of the same type by deactivating any active ones
      currently_active_tool = @gestures[event_type].active
      if currently_active_tool?
        logger.debug("Toolbar: deactivating tool: #{currently_active_tool.type} (#{currently_active_tool.id}) for event type '#{event_type}'")
        currently_active_tool.active = false
      # Update the gestures with the new active tool
      @gestures[event_type].active = tool
      logger.debug("Toolbar: activating tool: #{tool.type} (#{tool.id}) for event type '#{event_type}'")
    else
      @gestures[event_type].active = null

    return null

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
    } ]
    actions:    [ p.Array, [] ]
    inspectors: [ p.Array, [] ]
    help:       [ p.Array, [] ]
    toolbar_location: [ p.Location, 'right' ]
  }
