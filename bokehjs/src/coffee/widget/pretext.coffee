define [
  "backbone",
  "./paragraph"
], (Backbone, Paragraph) ->
  class PreTextView extends Paragraph.View
    tagName : "pre"
  class PreText extends Paragraph.Model
    type : "PreText"
    default_view : PreTextView
    defaults : () ->
      return {'text' : ''}
  class PreTexts extends Backbone.Collection
    model : PreText
  pretexts = new PreTexts()
  return {
    "Model" : PreText
    "Collection" : pretexts
    "View" : PreTextView
  }