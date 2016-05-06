_ = require "underscore"
$ = require "jquery"
$$1 = require "bootstrap/dropdown"
Backbone = require "backbone"
ActionTool = require "../models/tools/actions/action_tool"
HelpTool = require "../models/tools/actions/help_tool"
GestureTool = require "../models/tools/gestures/gesture_tool"
InspectTool = require "../models/tools/inspectors/inspect_tool"
{logger} = require "../core/logging"
toolbar_template = require "./toolbar_template"
HasProps = require "../core/has_props"
p = require "../core/properties"

class ToolManagerView extends Backbone.View
  template: toolbar_template

  initialize: (options) ->
    super(options)
    @location = options.location
    @listenTo(@model.get('plot'), 'change:tools change:logo', () => @render())
    @listenTo(@model, 'change', () => @render())

  render: () ->
    @$el.html(@template({logo: @model.get("plot")?.get("logo")}))
    @$el.addClass("bk-toolbar-#{@location}")
    @$el.addClass("bk-sidebar")

    inspectors = @model.get('inspectors')
    button_bar_list = @$(".bk-button-bar-list[type='inspectors']")
    if inspectors.length == 0
      button_bar_list.hide()
    else
      dropdown = $('<li>')
      dropdown.appendTo(button_bar_list)

      if @location == "below"
        dropdown.addClass("bk-bs-dropup")
      else
        dropdown.addClass("bk-bs-dropdown")

      button = $('<button type="button" class="bk-toolbar-button bk-bs-dropdown-toggle" data-bk-bs-toggle="dropdown">
        <div class="bk-btn-icon bk-tool-icon-inspector" />
      </button>')
      button.appendTo(dropdown)

      menu = $('<ul class="bk-bs-dropdown-menu" />')

      if @location == "right"
        menu.addClass("bk-bs-dropdown-menu-right")
      else
        menu.addClass("bk-bs-dropdown-menu-left")

      _.each(inspectors, (tool) ->
        item = $('<li />')
        item.append(new InspectTool.ListItemView({model: tool}).el)
        item.appendTo(menu)
      )
      menu.on('click', (e) -> e.stopPropagation())
      menu.appendTo(dropdown)
      button.dropdown()

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

    for type in ["pan", "scroll", "pinch", "tap", "press", "rotate", "inspectors", "actions", "help"]
       el = @$(".bk-button-bar-list[type='#{type}']")
       if el.children().length == 0
         el.remove()

    return @

class ToolManager extends HasProps
  type: 'ToolManager'

  initialize: (attrs, options) ->
    super(attrs, options)
    @listenTo(@get('plot'), 'change:tools', () => @_init_tools())
    @_init_tools()

  serializable_in_document: () -> false

  _init_tools: () ->
    for tool in @get('plot').get('tools')
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
          logger.warn("ToolManager: unknown event type '#{et}' for tool:
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

  _active_change: (tool) =>
    event_type = tool.event_type
    gestures = @get('gestures')

    # Toggle between tools of the same type by deactivating any active ones
    currently_active_tool = gestures[event_type].active
    if currently_active_tool? and currently_active_tool != tool
      logger.debug("ToolManager: deactivating tool: #{currently_active_tool.type} (#{currently_active_tool.id}) for event type '#{event_type}'")
      currently_active_tool.set('active', false)

    # Update the gestures with the new active tool
    gestures[event_type].active = tool
    @set('gestures', gestures)
    logger.debug("ToolManager: activating tool: #{tool.type} (#{tool.id}) for event type '#{event_type}'")
    return null

  @internal {
    gestures:   [ p.Any, () -> {
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
    plot:       [ p.Instance ]
  }

module.exports =
  Model: ToolManager
  View: ToolManagerView
