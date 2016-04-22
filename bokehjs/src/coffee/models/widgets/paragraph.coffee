_ = require "underscore"

Markup = require "./markup"
p = require "../../core/properties"

class ParagraphView extends Markup.View
  tagName: "p"

  render: () ->
    super()
    @$el.text(@mget('text'))
    return @

class Paragraph extends Markup.Model
  type: "Paragraph"
  default_view: ParagraphView

module.exports =
  Model: Paragraph
  View: ParagraphView
