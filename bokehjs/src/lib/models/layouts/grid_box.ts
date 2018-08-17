import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {Grid} from "core/layout"
import * as p from "core/properties"

export class GridBoxView extends LayoutDOMView {
  model: GridBox
  layout: Grid

  get child_models(): LayoutDOM[] {
    return this.model.children.map(([child,]) => child)
  }

  update_layout(): void {
    this.layout = new Grid()
    this.layout.sizing = this.box_sizing

    for (const [child, row, col] of this.model.children) {
      const child_view = this._child_views[child.id]
      this.layout.items.push({layout: child_view.layout, row, col})
    }
  }
}

export namespace GridBox {
  export interface Attrs extends LayoutDOM.Attrs {
    children: [LayoutDOM, number, number][]
  }

  export interface Props extends LayoutDOM.Props {
    children: p.Property<[LayoutDOM, number, number][]>
  }
}

export interface GridBox extends GridBox.Attrs {}

export class GridBox extends LayoutDOM {
  properties: GridBox.Props

  constructor(attrs?: Partial<GridBox.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "GridBox"
    this.prototype.default_view = GridBoxView

    this.define({
      children: [ p.Array, [] ],
    })
  }
}
GridBox.initClass()
