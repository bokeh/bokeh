import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {RowsSizing, ColsSizing} from "core/layout/grid"
import {enumerate} from "core/util/iterator"
import {keys} from "core/util/object"
import {isNumber, isPlainObject} from "core/util/types"
import {px} from "core/dom"
import * as p from "core/properties"

const {max} = Math

export class GridBoxView extends LayoutDOMView {
  override model: GridBox

  override connect_signals(): void {
    super.connect_signals()
    const {children, rows, cols, spacing} = this.model.properties
    this.on_change([children, rows, cols, spacing], () => this.rebuild())
  }

  get child_models(): LayoutDOM[] {
    return this.model.children.map(([child]) => child)
  }

  override _update_layout(): void {
    super._update_layout()

    const {style} = this.el
    style.display = "grid"

    const [row_gap, column_gap] = (() => {
      const {spacing} = this.model
      return isNumber(spacing) ? [spacing, spacing] : spacing
    })()

    style.rowGap = px(row_gap)
    style.columnGap = px(column_gap)

    let nrows = 0
    let ncols = 0

    for (const [[, row, col, row_span = 1, col_span = 1], i] of enumerate(this.model.children)) {
      const view = this.child_views[i]

      nrows = max(nrows, row + row_span)
      ncols = max(ncols, col + col_span)

      // CSS grid is 1-based, but layout is 0-based
      view.el.style.gridRowStart = `${row + 1}`
      view.el.style.gridRowEnd = `span ${row_span}`
      view.el.style.gridColumnStart = `${col + 1}`
      view.el.style.gridColumnEnd = `span ${col_span}`
    }

    const {rows, cols} = this.model
    if (isPlainObject(rows)) {
      nrows = max(nrows, ...keys(rows).map((i) => parseInt(i)))
    }
    if (isPlainObject(cols)) {
      ncols = max(ncols, ...keys(cols).map((i) => parseInt(i)))
    }

    style.gridTemplateRows = `repeat(${nrows}, max-content)`    // TODO: this.model.rows
    style.gridTemplateColumns = `repeat(${ncols}, max-content)` // TODO: this.model.cols
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

  static {
    this.prototype.default_view = GridBoxView

    this.define<GridBox.Props>(({Any, Int, Number, Tuple, Array, Ref, Or, Opt}) => ({
      children: [ Array(Tuple(Ref(LayoutDOM), Int, Int, Opt(Int), Opt(Int))), [] ],
      rows:     [ Any /*TODO*/, "auto" ],
      cols:     [ Any /*TODO*/, "auto" ],
      spacing:  [ Or(Number, Tuple(Number, Number)), 0 ],
    }))
  }
}
