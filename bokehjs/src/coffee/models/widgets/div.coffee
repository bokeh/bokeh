_ = require "underscore"

Markup = require "./markup"
BokehView = require "../../core/bokeh_view"
p = require "../../core/properties"

class DivView extends BokehView
  tagName: "div"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    if @mget('height')
      @$el.height(@mget('height'))
    if @mget('width')
      @$el.width(@mget('width'))
    if @mget('render_as_text') == true
        @$el.text(@mget('text'))
    else
        @$el.html(@mget('text'))
    return @

class Div extends Markup.Model
  type: "Div"
  default_view: DivView

  props: () ->
    return _.extend {}, super(), {
      text:           [ p.String, '' ]
      width:          [ p.Number, 600]
      height:         [ p.Number, 400]
      render_as_text: [ p.Bool,   false]
    }

module.exports =
  Model: Div
  View: DivView
