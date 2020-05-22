import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {Grid, RowsSizing, ColsSizing} from "core/layout/grid"
import * as p from "core/properties"

export class GridBoxView extends LayoutDOMView {
  model: GridBox
  layout: Grid

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.children.change, () => this.rebuild())
  }

  get child_models(): LayoutDOM[] {
    return this.model.children.map(([child]) => child)
  }

  _update_layout(): void {
    this.layout = new Grid()
    this.layout.rows = this.model.rows
    this.layout.cols = this.model.cols
    this.layout.spacing = this.model.spacing

    for (const [child, row, col, row_span, col_span] of this.model.children) {
      const child_view = this._child_views.get(child)!
      this.layout.items.push({layout: child_view.layout, row, col, row_span, col_span})
    }

    this.layout.set_sizing(this.box_sizing())
  }
}

export namespace GridBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    children: p.Property<[LayoutDOM, number, number, number?, number?][]>
    rows: p.Property<RowsSizing>
    cols: p.Property<ColsSizing>
    spacing: p.Property<number | [number, number]>
  }
}

export interface GridBox extends GridBox.Attrs {}

export class GridBox extends LayoutDOM {
  properties: GridBox.Props
  __view_type__: GridBoxView

  constructor(attrs?: Partial<GridBox.Attrs>) {
    super(attrs)
  }

  static init_GridBox(): void {
    this.prototype.default_view = GridBoxView

    this.define<GridBox.Props>({
      children: [ p.Array,  []     ],
      rows:     [ p.Any,    "auto" ],
      cols:     [ p.Any,    "auto" ],
      spacing:  [ p.Any,    0      ],
    })
  }
}
