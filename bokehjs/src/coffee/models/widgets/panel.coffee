import * as _ from "underscore"
import * as $ from "jquery"

import * as p from "../../core/properties"

import * as Widget from "./widget"

class PanelView extends Widget.View

  render: () ->
    super()
    @$el.empty()
    return @

class Panel extends Widget.Model
  type: "Panel"
  default_view: PanelView

  @define {
      title:    [ p.String,  ""    ]
      child:    [ p.Instance       ]
      closable: [ p.Bool,    false ]
    }

export {
  Panel as Model
  PanelView as View
}
