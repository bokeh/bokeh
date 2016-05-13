_ = require "underscore"

build_views = require "../../common/build_views"
p = require "../../core/properties"

AbstractButton = require "./abstract_button"
Widget = require "./widget"

template = require "./button_template"

class ButtonView extends Widget.View
  events:
    "click": "change_input"
  template: template

  initialize: (options) ->
    super(options)
    @icon_views = {}
    @listenTo(@model, 'change', @render)
    @render()

  render: () ->
    super()

    icon = @mget('icon')
    if icon?
      build_views(@icon_views, [icon])
      for own key, val of @icon_views
        val.$el.detach()

    @$el.empty()
    html = @template(@model.attributes)
    @$el.append(html)

    label = @mget("label")
    if icon?
      @$el.find('button').append(@icon_views[icon.id].$el)
      label = " #{label}"

    @$el.find('button').append(label)

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

  @override {
      height: 45
    }

module.exports =
  Model: Button
  View: ButtonView
