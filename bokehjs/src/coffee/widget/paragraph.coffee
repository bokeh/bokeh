define [
  "common/has_parent",
  "common/continuum_view",
  "backbone"
], (HasParent, continuum_view, Backbone) ->
  ContinuumView = continuum_view.View
  class ParagraphView extends ContinuumView
    tagName : "p"
    initialize : (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', @render)
    render: () ->
      if @mget('height')
        @$el.height(@mget('height'))
      if @mget('width')
        @$el.width(@mget('width'))
      @$el.text(@mget('text'))
  class Paragraph extends HasParent
    type : "Paragraph"
    default_view : ParagraphView
    defaults : () ->
      return {'text' : ''}
  class Paragraphs extends Backbone.Collection
    model : Paragraph
  paragraphs = new Paragraphs()
  return {
    "Model" : Paragraph
    "Collection" : paragraphs
    "View" : ParagraphView
  }