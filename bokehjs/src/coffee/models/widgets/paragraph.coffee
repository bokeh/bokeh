_ = require "underscore"

Markup = require "./markup"
BokehView = require "../../core/bokeh_view"
p = require "../../core/properties"

class ParagraphView extends BokehView
  tagName: "p"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    if @mget('height')
      @$el.height(@mget('height'))
    if @mget('width')
      @$el.width(@mget('width'))
    @$el.text(@mget('text'))
    return @

class Paragraph extends Markup.Model
  type: "Paragraph"
  default_view: ParagraphView

  @define {
      text: [ p.String, '' ]
    }

module.exports =
  Model: Paragraph
  View: ParagraphView
