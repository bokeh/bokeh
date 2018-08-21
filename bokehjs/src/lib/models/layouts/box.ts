import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {Grid} from "core/layout"
import * as p from "core/properties"

export abstract class BoxView extends LayoutDOMView {
  model: Box
  layout: Grid

  update_layout(): void {
    this.layout = new Grid()
    this.layout.sizing = this.box_sizing()
  }

  get child_models(): LayoutDOM[] {
    return this.model.children
  }
}

export namespace Box {
  export interface Attrs extends LayoutDOM.Attrs {
    children: LayoutDOM[]
  }

  export interface Props extends LayoutDOM.Props {
    children: p.Property<LayoutDOM[]>
  }
}

export interface Box extends Box.Attrs {}

export abstract class Box extends LayoutDOM {
  properties: Box.Props

  constructor(attrs?: Partial<Box.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Box"

    this.define({
      children: [ p.Array, [] ],
    })
  }
}
Box.initClass()
