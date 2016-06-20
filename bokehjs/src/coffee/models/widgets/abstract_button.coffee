p = require "../../core/properties"

Widget = require "./widget"


class AbstractButton extends Widget.Model
  type: "AbstractButton"

  @define {
    callback:    [ p.Instance          ]
    label:       [ p.String, "Button"  ]
    icon:        [ p.Instance          ]
    button_type: [ p.String, "default" ] # TODO (bev)
  }


module.exports =
  Model: AbstractButton
