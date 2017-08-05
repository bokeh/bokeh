import {Widget, WidgetView} from "./widget"
import * as p from "core/properties"
import {empty} from "core/dom"

export class PanelView extends WidgetView

  render: () ->
    super()
    empty(@el)
    return @

export class Panel extends Widget
  type: "Panel"
  default_view: PanelView

  @define {
      title:    [ p.String,  ""    ]
      child:    [ p.Instance       ]
      closable: [ p.Bool,    false ]
    }
