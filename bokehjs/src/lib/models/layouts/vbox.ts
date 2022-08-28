import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {GridAlignmentLayout} from "./alignments"
import {UIElement} from "../ui/ui_element"
import {px, CSSOurStyles} from "core/dom"
import {Container} from "core/layout/grid"
import {enumerate} from "core/util/iterator"
import {keys} from "core/util/object"
import {isNumber, isPlainObject} from "core/util/types"
import * as p from "core/properties"

const {max} = Math

type Item = {child: UIElement, row?: number, span?: number}

export class VBoxView extends LayoutDOMView {
  override model: VBox

  override connect_signals(): void {
    super.connect_signals()
    const {items, rows, spacing} = this.model.properties
    this.on_change([items, rows, spacing], () => this.rebuild())
  }

  get child_models(): UIElement[] {
    return this.model.items.map(({child}) => child)
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

    const layoutable = new Container<LayoutDOMView>()

    for (const [{row=nrows, span=1}, i] of enumerate(this.model.items)) {
      const view = this.child_views[i]

      nrows = max(nrows, row + span)

      // CSS grid is 1-based, but layout is 0-based
      const styles: CSSOurStyles = {}
      styles.grid_row_start = `${row + 1}`
      styles.grid_row_end = `span ${span}`
      styles.grid_column_start = `${1}`
      styles.grid_column_end = `span ${1}`
      view.style.append(":host", styles)

      if (view instanceof LayoutDOMView && view.layout != null) {
        const r0 = row
        const c0 = 0
        const r1 = row + span - 1
        const c1 = 1
        layoutable.add({r0, c0, r1, c1}, view)
      }
    }

    const {rows} = this.model
    if (isPlainObject(rows)) {
      nrows = max(nrows, ...keys(rows).map((i) => parseInt(i)))
    }

    styles.grid_template_rows = `repeat(${nrows}, 1fr)`
    styles.grid_template_columns = "1fr"

    this.style.append(":host", styles)

    if (layoutable.size != 0) {
      this.layout = new GridAlignmentLayout(layoutable)
      this.layout.set_sizing()
    } else {
      delete this.layout
    }
  }
}

export namespace VBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    items: p.Property<Item[]>
    rows: p.Property<"auto">
    spacing: p.Property<number>
  }
}

export interface VBox extends VBox.Attrs {}

export class VBox extends LayoutDOM {
  override properties: VBox.Props
  override __view_type__: VBoxView

  constructor(attrs?: Partial<VBox.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = VBoxView

    this.define<VBox.Props>(({Int, Number, Struct, Array, Ref, Opt, Auto}) => ({
      items: [ Array(Struct({child: Ref(UIElement), row: Opt(Int), span: Opt(Int)})), [] ],
      rows: [ Auto, "auto" ],
      spacing: [ Number, 0 ],
    }))
  }
}
