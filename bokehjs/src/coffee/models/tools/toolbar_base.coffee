_ = require "underscore"
$ = require "jquery"
$$1 = require "bootstrap/dropdown"

{logger} = require "../../core/logging"
{EQ, Variable}  = require "../../core/layout/solver"
p = require "../../core/properties"

LayoutDOM = require "../layouts/layout_dom"

ActionTool = require "./actions/action_tool"
HelpTool = require "./actions/help_tool"
GestureTool = require "./gestures/gesture_tool"
InspectTool = require "./inspectors/inspect_tool"
toolbar_template = require "./toolbar_template"


class ToolbarBaseView extends LayoutDOM.View
  className: "bk-toolbar-wrapper"
  template: toolbar_template

  render: () ->
    if @model.sizing_mode != 'fixed'
      @$el.css({
        left: @model._dom_left._value
        top: @model._dom_top._value
        'width': @model._width._value
        'height': @model._height._value
      })
    location = if @model.toolbar_location? then @model.toolbar_location else 'above'
    sticky = if @model.toolbar_sticky is true then 'sticky' else 'not-sticky'
    @$el.html(@template({logo: @mget("logo"), location: location, sticky: sticky}))

    inspectors = @model.get('inspectors')
    button_bar_list = @$(".bk-bs-dropdown[type='inspectors']")

    if inspectors.length == 0
      button_bar_list.hide()
    else
      anchor = $('<a href="#" data-bk-bs-toggle="dropdown"
                  class="bk-bs-dropdown-toggle">inspect
                  <span class="bk-bs-caret"></a>')
      anchor.appendTo(button_bar_list)
      ul = $('<ul class="bk-bs-dropdown-menu" />')
      _.each(inspectors, (tool) ->
        item = $('<li />')
        item.append(new InspectTool.ListItemView({model: tool}).el)
        item.appendTo(ul)
      )
      ul.on('click', (e) -> e.stopPropagation())
      ul.appendTo(button_bar_list)
      anchor.dropdown()

    button_bar_list = @$(".bk-button-bar-list[type='help']")
    _.each(@model.get('help'), (item) ->
      button_bar_list.append(new ActionTool.ButtonView({model: item}).el)
    )

    button_bar_list = @$(".bk-button-bar-list[type='actions']")
    _.each(@model.get('actions'), (item) ->
      button_bar_list.append(new ActionTool.ButtonView({model: item}).el)
    )

    gestures = @model.get('gestures')
    for et of gestures
      button_bar_list = @$(".bk-button-bar-list[type='#{et}']")
      _.each(gestures[et].tools, (item) ->
        button_bar_list.append(new GestureTool.ButtonView({model: item}).el)
      )

    return @


class ToolbarBase extends LayoutDOM.Model
  type: 'ToolbarBase'
  default_view: ToolbarBaseView

  _active_change: (tool) =>
    event_type = tool.event_type
    gestures = @get('gestures')

    # Toggle between tools of the same type by deactivating any active ones
    currently_active_tool = gestures[event_type].active
    if currently_active_tool? and currently_active_tool != tool
      logger.debug("Toolbar: deactivating tool: #{currently_active_tool.type} (#{currently_active_tool.id}) for event type '#{event_type}'")
      currently_active_tool.set('active', false)

    # Update the gestures with the new active tool
    gestures[event_type].active = tool
    @set('gestures', gestures)
    logger.debug("Toolbar: activating tool: #{tool.type} (#{tool.id}) for event type '#{event_type}'")
    return null

  get_constraints: () ->
    # Get the constraints from widget
    constraints = super()
    # Set the fixed size of toolbar
    constraints.push(EQ(@_sizeable, -30))
    return constraints

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

module.exports =
  Model: ToolbarBase
  View: ToolbarBaseView
