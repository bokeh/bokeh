_ = require "underscore"
Widget = require "./widget"
BokehView = require "../../core/bokeh_view"
p = require "../../core/properties"

class MarkupView extends BokehView
  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
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
    width: [ p.Number, none]
    height: [ p.Number, none]
  }

module.exports =
  Model: Markup
  View: MarkupView




