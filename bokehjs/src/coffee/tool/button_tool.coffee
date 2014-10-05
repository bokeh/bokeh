
define [
  "backbone"
  "./tool"
  "./button_tool_template"
], (Backbone, Tool, button_tool_template) ->

  class ButtonToolButtonView extends Backbone.View
    tagName: "li"
    template: button_tool_template
    events: {
      'click .bk-toolbar-button': '_clicked'
    }

    initialize: (options) ->
      super(options)
      @$el.html(@template(@model.attrs_and_props()))
      @listenTo(@model, 'change:active', @render)
      @render()

    render: () ->
      if @model.get('active')
        @$el.children('button').addClass('active')
      else
        @$el.children('button').removeClass('active')
      return @

    _clicked: () ->

  class ButtonToolView extends Tool.View

  class ButtonTool extends Tool.Model

    initialize: (attrs, options) ->
      super(attrs, options)
      @register_property('tooltip', () ->@get('tool_name'))

    defaults: () ->
      return _.extend({}, super(), {
        active: false
        tool_name: @tool_name
        icon: @icon
      })

  return {
    "Model": ButtonTool
    "View": ButtonToolView
    "ButtonView": ButtonToolButtonView
  }
