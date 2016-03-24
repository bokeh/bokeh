_ = require "underscore"

Widget = require "./widget"
p = require "../../core/properties"

class AbstractButton extends Widget.Model
  type: "AbstractButton"

  @define {
      callback:    [ p.Instance          ]
      label:       [ p.String, "Button"  ]
      icon:        [ p.String            ]
      button_type: [ p.String, "default" ] # TODO (bev)
    }

module.exports =
  Model: AbstractButton
