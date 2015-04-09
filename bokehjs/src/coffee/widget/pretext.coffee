_ = require "underscore"
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

module.exports =
  Model: PreText
  View: PreTextView