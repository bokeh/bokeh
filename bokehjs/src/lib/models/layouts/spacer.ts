import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import * as p from "core/properties"

export class SpacerView extends LayoutDOMView {
  override model: Spacer

  get child_models(): LayoutDOM[] {
    return []
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

  static {
    this.prototype.default_view = SpacerView
  }
}
