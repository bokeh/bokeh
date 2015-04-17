_  = require "underscore"
ContinuumView  = require "../common/continuum_view"
HasParent = require "../common/has_parent"

class ToggleView extends ContinuumView
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
    @$el.addClass("bk-bs-btn-" + @mget("type"))
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
    @mset('active', @$el.hasClass("bk-bs-active"))
    @model.save()
    @mget('callback')?.execute(@model)

class Toggle extends HasParent
  type: "Toggle"
  default_view: ToggleView

  defaults: ->
    return _.extend {}, super(), {
      active: false
      label: "Toggle"
      icon: null
      type: "default"
      disabled: false
    }

module.exports =
  Model: Toggle
  View: ToggleView