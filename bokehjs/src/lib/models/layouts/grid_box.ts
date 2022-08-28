import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {GridAlignmentLayout} from "./alignments"
import {UIElement} from "../ui/ui_element"
import {px, CSSOurStyles} from "core/dom"
import {RowsSizing, ColsSizing, Container} from "core/layout/grid"
import {enumerate} from "core/util/iterator"
import {keys} from "core/util/object"
import {isNumber, isPlainObject} from "core/util/types"
import * as p from "core/properties"

const {max} = Math

export class GridBoxView extends LayoutDOMView {
  override model: GridBox

  override connect_signals(): void {
    super.connect_signals()
    const {children, rows, cols, spacing} = this.model.properties
    this.on_change([children, rows, cols, spacing], () => this.rebuild())
  }

  get child_models(): UIElement[] {
    return this.model.children.map(([child]) => child)
  }

  override _update_layout(): void {
    super._update_layout()

    const styles: CSSOurStyles = {}
    styles.display = "grid"

    const [row_gap, column_gap] = (() => {
      const {spacing} = this.model
      return isNumber(spacing) ? [spacing, spacing] : spacing
    })()

    styles.row_gap = px(row_gap)
    styles.column_gap = px(column_gap)

    let nrows = 0
    let ncols = 0

    const layoutable = new Container<LayoutDOMView>()

    for (const [[, row, col, row_span = 1, col_span = 1], i] of enumerate(this.model.children)) {
      const view = this.child_views[i]

      nrows = max(nrows, row + row_span)
      ncols = max(ncols, col + col_span)

      // CSS grid is 1-based, but layout is 0-based
      const styles: CSSOurStyles = {}
      styles.grid_row_start = `${row + 1}`
      styles.grid_row_end = `span ${row_span}`
      styles.grid_column_start = `${col + 1}`
      styles.grid_column_end = `span ${col_span}`
      view.style.append(":host", styles)

      if (view instanceof LayoutDOMView && view.layout != null) {
        const r0 = row
        const c0 = col
        const r1 = row + row_span - 1
        const c1 = col + col_span - 1
        layoutable.add({r0, c0, r1, c1}, view)
      }
    }

    const {rows, cols} = this.model
    if (isPlainObject(rows)) {
      nrows = max(nrows, ...keys(rows).map((i) => parseInt(i)))
    }
    if (isPlainObject(cols)) {
      ncols = max(ncols, ...keys(cols).map((i) => parseInt(i)))
    }

    styles.grid_template_rows = `repeat(${nrows}, 1fr)`    // TODO: this.model.rows
    styles.grid_template_columns = `repeat(${ncols}, 1fr)` // TODO: this.model.cols

    this.style.append(":host", styles)

    if (layoutable.size != 0) {
      this.layout = new GridAlignmentLayout(layoutable)
      this.layout.set_sizing()
    } else {
      delete this.layout
    }
  }
}

export namespace GridBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    children: p.Property<[UIElement, number, number, number?, number?][]>
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
      children: [ Array(Tuple(Ref(UIElement), Int, Int, Opt(Int), Opt(Int))), [] ],
      rows:     [ Any /*TODO*/, "auto" ],
      cols:     [ Any /*TODO*/, "auto" ],
      spacing:  [ Or(Number, Tuple(Number, Number)), 0 ],
    }))
  }
}
