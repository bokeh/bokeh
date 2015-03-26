Collection = require "../common/collection"
Paragraph = require "./paragraph"

class PreTextView extends Paragraph.View
  tagName: "pre"
  attributes:
    style: "overflow:scroll"

class PreText extends Paragraph.Model
  type: "PreText"
  default_view: PreTextView

  defaults: ->
    return _.extend {}, super(), {
      text: ''
      height: 400
      width: 400
    }

class PreTexts extends Collection
  model: PreText

module.exports =
  Model: PreText
  View: PreTextView
  Collection: new PreTexts()