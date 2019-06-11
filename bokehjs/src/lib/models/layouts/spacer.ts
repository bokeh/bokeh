import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {LayoutItem} from "core/layout"
import * as p from "core/properties"

export class SpacerView extends LayoutDOMView {
  model: Spacer

  get child_models(): LayoutDOM[] {
    return []
  }

  _update_layout(): void {
    this.layout = new LayoutItem()
    this.layout.set_sizing(this.box_sizing())
  }
}

export namespace Spacer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props
}

export interface Spacer extends Spacer.Attrs {}

export class Spacer extends LayoutDOM {
  properties: Spacer.Props

  constructor(attrs?: Partial<Spacer.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.default_view = SpacerView
  }
}
Spacer.initClass()
