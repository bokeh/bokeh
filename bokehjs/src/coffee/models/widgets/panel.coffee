import {Widget, WidgetView} from "./widget"
import * as p from "core/properties"

export class PanelView extends WidgetView

  render: () ->
    super()
    @$el.empty()
    return @

export class Panel extends Widget
  type: "Panel"
  default_view: PanelView

  @define {
      title:    [ p.String,  ""    ]
      child:    [ p.Instance       ]
      closable: [ p.Bool,    false ]
    }
