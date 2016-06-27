$ = require "jquery"

Markup = require "./markup"

class ParagraphView extends Markup.View

  render: () ->
    super()
    # This overrides default user-agent styling and helps layout work
    $para = $('<p style="margin: 0;"></p>').text(@model.text)
    @$el.find('.bk-markup').append($para)

class Paragraph extends Markup.Model
  type: "Paragraph"
  default_view: ParagraphView

module.exports =
  Model: Paragraph
  View: ParagraphView
