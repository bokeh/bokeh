import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import * as p from "core/properties"

export class BoxView extends LayoutDOMView {
  model: Box
}

export namespace Box {
  export interface Attrs extends LayoutDOM.Attrs {
    children: LayoutDOM[]
    spacing: number
  }

  export interface Props extends LayoutDOM.Props {
    children: p.Property<LayoutDOM[]>
    spacing: p.Property<number>
  }
}

export interface Box extends Box.Attrs {}

export class Box extends LayoutDOM {
  properties: Box.Props

  constructor(attrs?: Partial<Box.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Box"
    this.prototype.default_view = BoxView

    this.define({
      children: [ p.Array, [] ],
    })

    this.internal({
      spacing: [ p.Number, 6 ],
    })
  }
}
Box.initClass()
