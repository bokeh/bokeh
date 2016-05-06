_ = require "underscore"
Backbone = require "backbone"

Tool = require "./tool"
button_tool_template = require "./button_tool_template"
p = require "../../core/properties"

class ButtonToolButtonView extends Backbone.View
  tagName: "li"
  template: button_tool_template

  events: () ->
    # TODO (bev) this seems to work OK but maybe there is a better way
    if 'ontouchstart' of document
      return { 'touchstart .bk-toolbar-button': '_clicked' }
    else
      return { 'click .bk-toolbar-button': '_clicked' }

  initialize: (options) ->
    super(options)
    @$el.html(@template({model: @model}))
    @listenTo(@model, 'change:active', () => @render())
    @listenTo(@model, 'change:disabled', () => @render())
    @render()

  render: () ->
    @$el.children('button')
        .prop("disabled", @model.get('disabled'))
        .toggleClass('bk-active', @model.get('active'))
    return @

  _clicked: (e) ->

class ButtonToolView extends Tool.View

class ButtonTool extends Tool.Model
  icon: null

  initialize: (attrs, options) ->
    super(attrs, options)
    @define_computed_property('tooltip', () -> @tool_name)

  @internal {
    disabled: [ p.Boolean, false ]
  }

module.exports =
  Model: ButtonTool
  View: ButtonToolView
  ButtonView: ButtonToolButtonView
