
define [
  "underscore"
  "backbone"
  "./logging"
  "./toolbar_template"
  "tool/actions/action_tool"
  "tool/gestures/gesture_tool"
  "tool/inspectors/inspect_tool"
], (_, Backbone, Logging, toolbar_template, ActionTool, GestureTool, InspectTool) ->

  logger = Logging.logger

  _event_types = ['rotate', 'pinch', 'press', 'scroll', 'tap', 'doubletap', 'pan']

  class ToolManagerView extends Backbone.View
    className: "bk-sidebar"
    template: toolbar_template

    initialize: (options) ->
      super(options)
      @listenTo(@model, 'change', @render)

    render: () ->
      @$el.html(@template())
      button_bar_list = @$('.bk-button-bar-list')

      # if @model.get('move').length > 0
      #   dropdown = $('<div class="bk-bs-btn-group" />')
      #   button = $('<button type="button" data-toggle="dropdown" class="bk-bs-btn bk-bs-btn-default bk-bs-dropdown-toggle">inspect <span class="caret"></span></button>')
      #   button.appendTo(dropdown)
      #   ul = $('<ul class="bk-bs-dropdown-menu" />')
      #   _.each(@model.get('move').tools, (item) ->
      #     item = $('<li />')
      #     item.append(new InspectTool.ListItemView({model: item}).el)
      #     item.appendTo(ul)
      #   )
      #   dropdown.render()

      button_bar_list = @$(".bk-button-bar-list[type='action']")
      _.each(@model.get('actions'), (item) =>
        button_bar_list.append(new ActionTool.ButtonView({model: item}).el)
      )

      gestures = @model.get('gestures')
      for et in _event_types
        button_bar_list = @$(".bk-button-bar-list[type='#{et}']")
        _.each(gestures[et].tools, (item) =>
          button_bar_list.append(new GestureTool.ButtonView({model: item}).el)
        )

      return @

  class ToolManager extends Backbone.Model

    initialize: (attrs, options) ->
      super(attrs, options)

      gestures = @get('gestures')

      for tool in @get('tools')

        if tool instanceof InspectTool.Model
          @get('inspectors').push(tool)

        else if tool instanceof ActionTool.Model
          @get('actions').push(tool)

        else if tool instanceof GestureTool.Model
          et = tool.get('event_type')

          if et not in _event_types
            logger.warn("ToolManager: unknown event type '#{et}' for tool: #{tool.type} (#{tool.id})")
            continue

          gestures[et].tools.push(tool)
          @listenTo(tool, 'change:active', _.bind(@_active_change, tool))

      for et in _event_types
        tools = gestures[et].tools
        if tools.length == 0
          continue
        gestures[et].tools = _.sortBy(tools, (tool) -> tool.get('default_order'))
        gestures[et].tools[0].set('active', true)

    _active_change: (tool) =>
      et = tool.get('event_type')

      active = tool.get('active')
      if not active
        return null

      gestures = @get('gestures')
      prev = gestures[et].active
      if prev?
        logger.debug("ToolManager: deactivating tool: #{prev.type} (#{prev.id}) for event type '#{et}'")
        prev.set('active', false)

      gestures[et].active = tool
      @set('gestures', gestures)
      logger.debug("ToolManager: activating tool: #{tool.type} (#{tool.id}) for event type '#{et}'")
      return null

    defaults: () ->
      return {
        gestures: {
          pan: {tools: [], active: null}
          tap: {tools: [], active: null}
          doubletap: {tools: [], active: null}
          scroll: {tools: [], active: null}
          pinch: {tools: [], active: null}
          press: {tools: [], active: null}
          rotate: {tools: [], active: null}
        }
        actions: []
        inspectors: []
      }

  return {
    "Model": ToolManager
    "View": ToolManagerView
  }
