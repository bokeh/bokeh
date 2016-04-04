_  = require "underscore"

AbstractButton = require "./abstract_button"
BokehView  = require "../../core/bokeh_view"
p = require "../../core/properties"

class ToggleView extends BokehView
  tagName: "button"
  events:
    "click": "change_input"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    icon = @mget('icon')
    if icon?
      build_views(@views, [icon])
      for own key, val of @views
        val.$el.detach()

    @$el.empty()
    @$el.addClass("bk-bs-btn")
    @$el.addClass("bk-bs-btn-" + @mget("button_type"))
    if @mget("disabled") then @$el.attr("disabled", "disabled")

    label = @mget("label")
    if icon?
      @$el.append(@views[icon.id].$el)
      label = " #{label}"
    @$el.append(document.createTextNode(label))

    if @mget("active")
      @$el.addClass("bk-bs-active")

    @$el.attr("data-bk-bs-toggle", "button")
    return @

  change_input: () ->
    @mset('active', not @mget('active'))
    @mget('callback')?.execute(@model)

class Toggle extends AbstractButton.Model
  type: "Toggle"
  default_view: ToggleView

  @define {
      active: [ p. Bool, false ]
    }

  defaults: ->
    return _.extend {}, super(), {
      # overrides
      label: "Toggle"
    }

module.exports =
  Model: Toggle
  View: ToggleView
