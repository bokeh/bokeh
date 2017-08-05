import {logger} from "core/logging"
import {EQ} from "core/layout/solver"
import {empty} from "core/dom"
import * as p from "core/properties"

import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"

import {ActionToolButtonView} from "./actions/action_tool"
import {OnOffButtonView} from "./on_off_button"
import toolbar_template from "./toolbar_template"

export class ToolbarBaseView extends LayoutDOMView
  className: "bk-toolbar-wrapper"
  template: toolbar_template

  render: () ->
    empty(@el)

    if @model.sizing_mode != 'fixed'
      @el.style.left = "#{@model._dom_left.value}px"
      @el.style.top = "#{@model._dom_top.value}px"
      @el.style.width = "#{@model._width.value}px"
      @el.style.height = "#{@model._height.value}px"

    @el.appendChild(@template({
      logo: @model.logo
      location: @model.toolbar_location
      sticky: if @model.toolbar_sticky then 'sticky' else 'not-sticky'
    }))

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

export class ToolbarBase extends LayoutDOM
  type: 'ToolbarBase'
  default_view: ToolbarBaseView

  initialize: (attrs, options) ->
    super(attrs, options)
    @_set_sizeable()
    @connect(@properties.toolbar_location.change, () => @_set_sizeable())

  _set_sizeable: () ->
    horizontal = @toolbar_location in ['left', 'right']
    @_sizeable = if not horizontal then @_height else @_width

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

  get_constraints: () ->
    # Get the constraints from widget
    return super().concat([
      # Set the fixed size of toolbar
      EQ(@_sizeable, -30),
    ])

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

  @override {
    sizing_mode: null
  }
