_ = require "underscore"

Markup = require "./markup"
p = require "../../core/properties"

class DivView extends Markup.View
  tagName: "div"

  render: () ->
    super()
    if @mget('render_as_text') == true
        @$el.text(@mget('text'))
    else
        @$el.html(@mget('text'))
    return @

class Div extends Markup.Model
  type: "Div"
  default_view: DivView

  props: () ->
    return _.extend {}, super(), {
      render_as_text: [ p.Bool,   false]
    }

module.exports =
  Model: Div
  View: DivView
