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

    sticky = if @model.toolbar_sticky then 'sticky' else 'not-sticky'

    @el.classList.add("bk-toolbar")
    @el.classList.add("bk-toolbar-#{@model.toolbar_location}")
    @el.classList.add("bk-toolbar-#{sticky}")

    if @model.logo?
      cls = if @model.logo == "grey" then "bk-grey" else null
      logo = a({href: "https://bokeh.pydata.org/", target: "_blank", class: ["bk-logo", "bk-logo-small", cls]})
      @el.appendChild(logo)

    button_bar =
      div({class: 'bk-button-bar'},
        div({class: "bk-button-bar-list", type: "pan"}),
        div({class: "bk-button-bar-list", type: "scroll"}),
        div({class: "bk-button-bar-list", type: "pinch"}),
        div({class: "bk-button-bar-list", type: "tap"}),
        div({class: "bk-button-bar-list", type: "press"}),
        div({class: "bk-button-bar-list", type: "rotate"}),
        div({class: "bk-button-bar-list", type: "actions"}),
        div({class: "bk-button-bar-list", type: "inspectors"}),
        div({class: "bk-button-bar-list", type: "help"}),
      )
    @el.appendChild(button_bar)

    buttons = @el.querySelector(".bk-button-bar-list[type='inspectors']")
    for obj in @model.inspectors
      if obj.toggleable
        buttons.appendChild(new OnOffButtonView({model: obj, parent: @}).el)

    buttons = @el.querySelector(".bk-button-bar-list[type='help']")
    for obj in @model.help
      buttons.appendChild(new ActionToolButtonView({model: obj, parent: @}).el)

    buttons = @el.querySelector(".bk-button-bar-list[type='actions']")
    for obj in @model.actions
      buttons.appendChild(new ActionToolButtonView({model: obj, parent: @}).el)

    gestures = @model.gestures
    for et of gestures
      buttons = @el.querySelector(".bk-button-bar-list[type='#{et}']")
      for obj in gestures[et].tools
        buttons.appendChild(new OnOffButtonView({model: obj, parent: @}).el)

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
      tap:       { tools: [], active: null }
      doubletap: { tools: [], active: null }
      scroll:    { tools: [], active: null }
      pinch:     { tools: [], active: null }
      press:     { tools: [], active: null }
      rotate:    { tools: [], active: null }
    } ]
    actions:    [ p.Array, [] ]
    inspectors: [ p.Array, [] ]
    help:       [ p.Array, [] ]
    toolbar_location: [ p.Location, 'right' ]
    toolbar_sticky: [ p.Bool ]
  }
