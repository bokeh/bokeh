_ = require "underscore"

Widget = require "./widget"
p = require "../../core/properties"

class InputWidget extends Widget.Model
  type: "InputWidget"

  props: ->
    return _.extend {}, super(), {
      callback: [ p.Instance   ]
      title:    [ p.String, '' ]
    }

module.exports =
  Model: InputWidget