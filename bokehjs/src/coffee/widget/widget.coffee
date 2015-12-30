_ = require "underscore"
Component = require "./component"

class Widget extends Component.Model
  type: "Widget"

  defaults: ->
    return _.extend {}, super(), {
      css_classes: []
    }

  css_classes: () ->
    return @get('css_classes')

module.exports =
  Model: Widget
