_ = require "underscore"
$ = require "jquery"

AbstractButton = require "./abstract_button"
build_views = require "../../common/build_views"
BokehView = require "../../core/bokeh_view"
p = require "../../core/properties"

class ButtonView extends AbstractButton.View
  events:
    "click": "change_input"

  render: () ->
    @$el.empty()

    $button = $('<button></button>')
    $button.attr("type","button")
    $button.addClass("bk-bs-btn")
    $button.addClass("bk-bs-btn-" + @mget("type"))
    $button.text(@mget("label"))
    if @mget("disabled") 
      $button.attr("disabled", "disabled")

    @$el.append($button)
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
