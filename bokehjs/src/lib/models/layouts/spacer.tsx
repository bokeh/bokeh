import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import type * as p from "core/properties"

export class SpacerView extends LayoutDOMView {
  declare model: Spacer

  get child_models(): LayoutDOM[] {
    return []
  }

  protected override readonly _auto_width = "auto"
  protected override readonly _auto_height = "auto"
}

export namespace Spacer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props
}

export interface Spacer extends Spacer.Attrs {}

export class Spacer extends LayoutDOM {
  declare properties: Spacer.Props
  declare __view_type__: SpacerView

  constructor(attrs?: Partial<Spacer.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SpacerView
  }
}
