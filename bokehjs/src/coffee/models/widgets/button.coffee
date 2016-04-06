_ = require "underscore"

AbstractButton = require "./abstract_button"
build_views = require "../../common/build_views"
BokehView = require "../../core/bokeh_view"
p = require "../../core/properties"

class ButtonView extends AbstractButton.View
  tagName: "button"
  events:
    "click": "change_input"

  render: () ->
    icon = @mget('icon')
    if icon?
      build_views(@views, [icon])
      for own key, val of @views
        val.$el.detach()

    @$el.empty()
    @$el.attr("type","button")
    @$el.addClass("bk-bs-btn")
    @$el.addClass("bk-bs-btn-" + @mget("type"))
    if @mget("disabled") then @$el.attr("disabled", "disabled")

    label = @mget("label")
    if icon?
      @$el.append(@views[icon.id].$el)
      label = " #{label}"
    @$el.append(document.createTextNode(label))
    super()


  change_input: () ->
    @mset('clicks', @mget('clicks') + 1)
    @mget('callback')?.execute(@model)

class Button extends AbstractButton.Model
  type: "Button"
  default_view: ButtonView

  props: () ->
    return _.extend {}, super(), {
      clicks: [ p.Number, 0        ]
    }

module.exports =
  Model: Button
  View: ButtonView
