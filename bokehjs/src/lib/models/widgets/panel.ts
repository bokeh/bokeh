import {Widget, WidgetView} from "./widget"
import {LayoutDOM} from "../layouts/layout_dom"
import * as p from "core/properties"
import {empty} from "core/dom"

export class PanelView extends WidgetView {
  model: Panel

  render(): void {
    super.render()
    empty(this.el)
  }
}

export namespace Panel {
  export interface Attrs extends Widget.Attrs {
    title: string
    child: LayoutDOM
    closable: boolean
  }

  export interface Props extends Widget.Props {}
}

export interface Panel extends Panel.Attrs {}

export class Panel extends Widget {

  properties: Panel.Props

  constructor(attrs?: Partial<Panel.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
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
