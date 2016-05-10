_ = require "underscore"

build_views = require "../../common/build_views"
p = require "../../core/properties"

AbstractButton = require "./abstract_button"
Widget = require "./widget"

class ButtonView extends Widget.View
  tagName: "button"
  events:
    "click": "change_input"

  initialize: (options) ->
    super(options)
    @views = {}
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    super()
    icon = @mget('icon')
    if icon?
      build_views(@views, [icon])
      for own key, val of @views
        val.$el.detach()

    @$el.empty()
    @$el.attr("type","button")
    @$el.addClass("bk-bs-btn")
    @$el.addClass("bk-bs-btn-" + @mget("button_type"))
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

  @define {
      clicks: [ p.Number, 0        ]
    }

module.exports =
  Model: Button
  View: ButtonView
