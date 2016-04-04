_ = require "underscore"

Paragraph = require "./paragraph"
p = require "../../core/properties"

class PreTextView extends Paragraph.View
  tagName: "pre"
  attributes:
    style: "overflow:scroll"

class PreText extends Paragraph.Model
  type: "PreText"
  default_view: PreTextView

  @define {
      height: [ p.Number, 400 ]
      width:  [ p.Number, 500 ]
    }

module.exports =
  Model: PreText
  View: PreTextView
