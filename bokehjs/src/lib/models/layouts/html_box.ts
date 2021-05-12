import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {ContentBox} from "core/layout"
import * as p from "core/properties"

export abstract class HTMLBoxView extends LayoutDOMView {
  override model: HTMLBox

  get child_models(): LayoutDOM[] {
    return []
  }

  override _update_layout(): void {
    this.layout = new ContentBox(this.el)
    this.layout.set_sizing(this.box_sizing())
  }
}

export namespace HTMLBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props
}

export interface HTMLBox extends HTMLBox.Attrs {}

export abstract class HTMLBox extends LayoutDOM {
  override properties: HTMLBox.Props
  override __view_type__: HTMLBoxView

  constructor(attrs?: Partial<HTMLBox.Attrs>) {
    super(attrs)
  }
}
