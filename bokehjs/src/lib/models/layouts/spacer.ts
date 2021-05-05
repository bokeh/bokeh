import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {LayoutItem} from "core/layout"
import * as p from "core/properties"

export class SpacerView extends LayoutDOMView {
  override model: Spacer

  get child_models(): LayoutDOM[] {
    return []
  }

  override _update_layout(): void {
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
  override properties: Spacer.Props
  override __view_type__: SpacerView

  constructor(attrs?: Partial<Spacer.Attrs>) {
    super(attrs)
  }

  static init_Spacer(): void {
    this.prototype.default_view = SpacerView
  }
}
