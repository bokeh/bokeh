/* XXX: partial */
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

  static initClass() {
    this.prototype.type = "Panel"
    this.prototype.default_view = PanelView

    this.define({
      title:    [ p.String,  ""    ],
      child:    [ p.Instance       ],
      closable: [ p.Bool,    false ],
    })
  }
}

Panel.initClass()
