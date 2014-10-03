
define [
  "backbone"
  "./tool"
  "./action_tool_button_template"
], (Backbone, Tool, action_tool_button_template) ->

  class ActionToolButtonView extends Backbone.View
    tagName: "li"
    template: action_tool_button_template
    events: {
      'click .bk-toolbar-button': '_clicked'
    }

    initialize: (options) ->
      @listenTo(@model, 'change:active', @render)
      @render()

    render: () ->
      @$el.html(@template(@model.attrs_and_props()))
      if @model.get('active')
        @$el.children('button').addClass('active')
      else
        @$el.children('button').removeClass('active')
      return @

    _clicked: () ->
      @model.set('active', true)

  class ActionToolView extends Tool.View

  class ActionTool extends Tool.Model

    initialize: (attrs, options) ->
      super(attrs, options)
      @register_property('tooltip', () ->@get('tool_name'))

    defaults: () ->
      return _.extend({}, super(), {
        default_active: false
        tool_name: @tool_name
        icon: @icon
      })

  return {
    "Model": ActionTool
    "View": ActionToolView
    "ButtonView": ActionToolButtonView
  }
