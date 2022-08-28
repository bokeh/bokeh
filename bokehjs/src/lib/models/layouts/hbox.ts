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

type Item = {child: UIElement, col?: number, span?: number}

export class HBoxView extends LayoutDOMView {
  override model: HBox

  override connect_signals(): void {
    super.connect_signals()
    const {items, cols, spacing} = this.model.properties
    this.on_change([items, cols, spacing], () => this.rebuild())
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

    let ncols = 0

    const layoutable = new Container<LayoutDOMView>()

    for (const [{col=ncols, span=1}, i] of enumerate(this.model.items)) {
      const view = this.child_views[i]

      ncols = max(ncols, col + span)

      // CSS grid is 1-based, but layout is 0-based
      const styles: CSSOurStyles = {}
      styles.grid_row_start = `${1}`
      styles.grid_row_end = `span ${1}`
      styles.grid_column_start = `${col + 1}`
      styles.grid_column_end = `span ${span}`
      view.style.append(":host", styles)

      if (view instanceof LayoutDOMView && view.layout != null) {
        const r0 = 0
        const c0 = col
        const r1 = 1
        const c1 = col + span - 1
        layoutable.add({r0, c0, r1, c1}, view)
      }
    }

    const {cols} = this.model
    if (isPlainObject(cols)) {
      ncols = max(ncols, ...keys(cols).map((i) => parseInt(i)))
    }

    styles.grid_template_rows = "1fr"
    styles.grid_template_columns = `repeat(${ncols}, 1fr)`

    this.style.append(":host", styles)

    if (layoutable.size != 0) {
      this.layout = new GridAlignmentLayout(layoutable)
      this.layout.set_sizing()
    } else {
      delete this.layout
    }
  }
}

export namespace HBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    items: p.Property<Item[]>
    cols: p.Property<"auto">
    spacing: p.Property<number>
  }
}

export interface HBox extends HBox.Attrs {}

export class HBox extends LayoutDOM {
  override properties: HBox.Props
  override __view_type__: HBoxView

  constructor(attrs?: Partial<HBox.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HBoxView

    this.define<HBox.Props>(({Int, Number, Struct, Array, Ref, Opt, Auto}) => ({
      items: [ Array(Struct({child: Ref(UIElement), col: Opt(Int), span: Opt(Int)})), [] ],
      cols: [ Auto, "auto" ],
      spacing: [ Number, 0 ],
    }))
  }
}
