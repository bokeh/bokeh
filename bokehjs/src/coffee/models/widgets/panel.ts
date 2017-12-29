import {Widget, WidgetView} from "./widget"
import * as p from "core/properties"
import {empty} from "core/dom"

export class PanelView extends WidgetView {
  model: Panel

  render(): void {
    super.render()
    empty(this.el)
  }
}

export class Panel extends Widget {
}

Panel.prototype.type = "Panel"
Panel.prototype.default_view = PanelView

Panel.define({
  title:    [ p.String,  ""    ],
  child:    [ p.Instance       ],
  closable: [ p.Bool,    false ],
})
