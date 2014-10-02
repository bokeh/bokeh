
define [
  "backbone"
  "./logging"
  "./toolbar_template"
  "tool/action_tool"
  "tool/inspect_tool"
], (Backbone, Logging, toolbar_template, ActionTool, InspectTool) ->

  logger = Logging.logger

  class ToolManagerView extends Backbone.View
    className: "bk-sidebar"
    template: toolbar_template

    initialize: (options) ->
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
      _.each(@model.get('action').tools, (item) =>
        button_bar_list.prepend(new ActionTool.ButtonView({model: item}).el)
      )

      for et in ['rotate', 'pinch', 'scroll', 'tap', 'pan']
        button_bar_list = @$(".bk-button-bar-list[type='#{et}']")
        _.each(@model.get(et).tools, (item) =>
          button_bar_list.prepend(new ActionTool.ButtonView({model: item}).el)
        )

      return @

  class ToolManager extends Backbone.Model

    initialize: (attrs, options) ->
      super(attrs, options)

      for tool in @get('tools')
        et = tool.event_type ? 'action'

        info = @get(et)
        if not info?
          logger.warn("ToolManager: unknown event type '#{et}' for tool: #{tool.type} (#{tool.id})")
          continue

        info.tools.push(tool)
        @listenTo(tool, 'change:active', _.bind(@_active_change, tool))

        if tool.get('default_active') ? false
          tool.set('active', true)

        @set(et, info)

    _active_change: (tool) =>
      et = tool.event_type ? 'action'
      if et == 'action'
        return null

      active = tool.get('active')
      if not active
        return null

      info = @get(et)
      if not info?
        logger.warn("ToolManager: unknown event type '#{et}' for tool: #{tool.type} (#{tool.id})")
        return null

      prev = info.active
      if prev?
        logger.debug("ToolManager: deactivating tool: #{prev.type} (#{prev.id}) for event type '#{et}'")
        prev.set('active', false)

      info.active = tool
      @set(et, info)
      logger.debug("ToolManager: activating tool: #{tool.type} (#{tool.id}) for event type '#{et}'")
      return null

    defaults: () ->
      return {
        pan: {tools: [], active: null}
        tap: {tools: [], active: null}
        doubletap: {tools: [], active: null}
        scroll: {tools: [], active: null}
        pinch: {tools: [], active: null}
        press: {tools: [], active: null}
        rotate: {tools: [], active: null}
        action: {tools: []}
        move: {tools: []}
      }

  return {
    "Model": ToolManager
    "View": ToolManagerView
  }
