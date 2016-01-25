_ = require "underscore"
build_views = require "../common/build_views"
ContinuumView = require "../common/continuum_view"
AbstractButton = require "./abstract_button"

class ButtonView extends ContinuumView
  tagName: "button"
  events:
    "click": "change_input"

  initialize: (options) ->
    super(options)
    @views = {}
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
    @$el.addClass("bk-bs-btn-" + @mget("type"))
    if @mget("disabled") then @$el.attr("disabled", "disabled")

    label = @mget("label")
    if icon?
      @$el.append(@views[icon.id].$el)
      label = " #{label}"
    @$el.append(document.createTextNode(label))

    return @

  change_input: () ->
    @mset('clicks', @mget('clicks') + 1)
    @mget('callback')?.execute(@model)

class Button extends AbstractButton.Model
  type: "Button"
  default_view: ButtonView

  defaults: () ->
    return _.extend {}, super(), {
      clicks: 0
      label: "Button"
    }

module.exports =
  Model: Button
  View: ButtonView
