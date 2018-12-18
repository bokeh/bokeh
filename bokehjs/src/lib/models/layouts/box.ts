import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {Grid} from "core/layout"
import * as p from "core/properties"

export abstract class BoxView extends LayoutDOMView {
  model: Box
  layout: Grid

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.children.change, () => this.rebuild())
  }

  get child_models(): LayoutDOM[] {
    return this.model.children
  }

  _update_layout(): void {
    this.layout = new Grid()
    this.layout.set_sizing(this.box_sizing())
  }
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

export abstract class Box extends LayoutDOM {
  properties: Box.Props

  constructor(attrs?: Partial<Box.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Box"

    this.define({
      children: [ p.Array,  [] ],
      spacing:  [ p.Number, 0  ],
    })
  }
}
Box.initClass()
