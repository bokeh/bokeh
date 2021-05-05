import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {Grid, RowsSizing, ColsSizing} from "core/layout/grid"
import * as p from "core/properties"

export class GridBoxView extends LayoutDOMView {
  override model: GridBox
  override layout: Grid

  override connect_signals(): void {
    super.connect_signals()
    const {children, rows, cols, spacing} = this.model.properties
    this.on_change([children, rows, cols, spacing], () => this.rebuild())
  }

  get child_models(): LayoutDOM[] {
    return this.model.children.map(([child]) => child)
  }

  override _update_layout(): void {
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
  override properties: GridBox.Props
  override __view_type__: GridBoxView

  constructor(attrs?: Partial<GridBox.Attrs>) {
    super(attrs)
  }

  static init_GridBox(): void {
    this.prototype.default_view = GridBoxView

    this.define<GridBox.Props>(({Any, Int, Number, Tuple, Array, Ref, Or, Opt}) => ({
      children: [ Array(Tuple(Ref(LayoutDOM), Int, Int, Opt(Int), Opt(Int))), [] ],
      rows:     [ Any /*TODO*/, "auto" ],
      cols:     [ Any /*TODO*/, "auto" ],
      spacing:  [ Or(Number, Tuple(Number, Number)), 0 ],
    }))
  }
}
