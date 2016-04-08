_ = require "underscore"

{WEAK_EQ} = require "../../core/layout/solver"
Widget = require "./widget"
p = require "../../core/properties"

class AbstractButtonView extends Widget.View

class AbstractButton extends Widget.Model
  type: "AbstractButton"
  default_view: AbstractButtonView

  props: ->
    return _.extend {}, super(), {
      callback: [ p.Instance          ]
      label:    [ p.String, "Button"  ]
      icon:     [ p.String            ]
      type:     [ p.String, "default" ] # TODO (bev)
    }

module.exports =
  Model: AbstractButton
  View: AbstractButtonView
