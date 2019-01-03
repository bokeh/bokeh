import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {HTML} from "core/layout"

export namespace HTMLBoxView {
  export type Options = LayoutDOMView.Options & {model: HTMLBox}
}

export abstract class HTMLBoxView extends LayoutDOMView {
  model: HTMLBox

  get child_models(): LayoutDOM[] {
    return []
  }

  _update_layout(): void {
    this.layout = new HTML(this.el)
    this.layout.set_sizing(this.box_sizing())
  }
}

export namespace HTMLBox {
  export interface Attrs extends LayoutDOM.Attrs {}

  export interface Props extends LayoutDOM.Props {}
}

export abstract class HTMLBox extends LayoutDOM {
  properties: HTMLBox.Props

  constructor(attrs?: Partial<HTMLBox.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "HTMLBox"
  }
}
HTMLBox.initClass()
