_ = require "underscore"

p = require "../../core/properties"

Widget = require "./widget"


class MarkupView extends Widget.View
  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    super()
    if @mget('height')
      @$el.height(@mget('height'))
    if @mget('width')
      @$el.width(@mget('width'))


class Markup extends Widget.Model
  type: "Markup"

  initialize: (options) ->
    super(options)

  @define {
    text: [ p.String, '' ]
  }

  @override {
    width: 500
    height: 400
  }

module.exports =
  Model: Markup
  View: MarkupView




