import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {Grid, RowSizing, ColSizing} from "core/layout/grid"
import * as p from "core/properties"

export class GridBoxView extends LayoutDOMView {
  model: GridBox
  layout: Grid

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.children.change, () => this.rebuild())
  }

  get child_models(): LayoutDOM[] {
    return this.model.children.map(([child,]) => child)
  }

  _update_layout(): void {
    this.layout = new Grid()
    this.layout.set_sizing(this.box_sizing())
    this.layout.rows = this.model.rows
    this.layout.cols = this.model.cols
    this.layout.spacing = this.model.spacing

    for (const [child, row, col] of this.model.children) {
      const child_view = this._child_views[child.id]
      this.layout.items.push({layout: child_view.layout, row, col})
    }
  }
}

export namespace GridBox {
  export interface Attrs extends LayoutDOM.Attrs {
    children: [LayoutDOM, number, number][]
    rows: {[key: number]: RowSizing}
    cols: {[key: number]: ColSizing}
    spacing: number | [number, number]
  }

  export interface Props extends LayoutDOM.Props {
    children: p.Property<[LayoutDOM, number, number][]>
    rows: p.Property<{[key: number]: RowSizing}>
    cols: p.Property<{[key: number]: ColSizing}>
    spacing: p.Property<number | [number, number]>
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
      children: [ p.Array,  []     ],
      rows:     [ p.Any,    "auto" ],
      cols:     [ p.Any,    "auto" ],
      spacing:  [ p.Number, 0      ],
    })
  }
}
GridBox.initClass()
