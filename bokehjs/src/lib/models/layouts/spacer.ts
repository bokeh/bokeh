import {LayoutDOM, LayoutDOMView} from "./layout_dom"

export class SpacerView extends LayoutDOMView {
  model: Spacer

  get child_models(): LayoutDOM[] {
    return []
  }

  update_layout(): void {
    // this.layout = TODO
  }
}

export namespace Spacer {
  export interface Attrs extends LayoutDOM.Attrs {}

  export interface Props extends LayoutDOM.Props {}
}

export interface Spacer extends Spacer.Attrs {}

export class Spacer extends LayoutDOM {
  properties: Spacer.Props

  constructor(attrs?: Partial<Spacer.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Spacer"
    this.prototype.default_view = SpacerView
  }
}
Spacer.initClass()
