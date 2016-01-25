_ = require "underscore"
ContinuumView = require "../common/continuum_view"
Markup = require "./markup"

class ParagraphView extends ContinuumView
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

  defaults: () ->
    return _.extend {}, super(), {
      text: ''
    }

module.exports =
  Model: Paragraph
  View: ParagraphView