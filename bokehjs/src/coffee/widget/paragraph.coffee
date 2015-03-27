_ = require "underscore"
Collection = require "../common/collection"
ContinuumView = require "../common/continuum_view"
HasParent = require "../common/has_parent"

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

class Paragraph extends HasParent
  type: "Paragraph"
  default_view: ParagraphView

  defaults: () ->
    return _.extend {}, super(), {
      text: ''
    }

class Paragraphs extends Collection
  model: Paragraph

module.exports =
  Model: Paragraph
  View: ParagraphView
  Collection: new Paragraphs()