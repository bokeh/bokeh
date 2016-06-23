$ = require "jquery"

Markup = require "./markup"
p = require "../../core/properties"

class PreTextView extends Markup.View

  render: () ->
    super()
    $pre = $('<pre style="overflow: auto"></pre>').text(@model.text)
    @$el.find('.bk-markup').append($pre)

class PreText extends Markup.Model
  type: "PreText"
  default_view: PreTextView

module.exports =
  Model: PreText
  View: PreTextView
