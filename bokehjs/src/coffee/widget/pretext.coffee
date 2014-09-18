define [
  "common/collection",
  "./paragraph"
], (Collection, Paragraph) ->
  class PreTextView extends Paragraph.View
    tagName : "pre"
    attributes:
      style : "overflow:scroll"
  class PreText extends Paragraph.Model
    type : "PreText"
    default_view : PreTextView
    defaults: ->
      return _.extend {}, super(), {
        text: ''
        height: 400
        width: 400
      }

  class PreTexts extends Collection
    model : PreText
  pretexts = new PreTexts()
  return {
    "Model" : PreText
    "Collection" : pretexts
    "View" : PreTextView
  }
