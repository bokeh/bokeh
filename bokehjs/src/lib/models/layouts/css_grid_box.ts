import type {FullDisplay} from "./layout_dom"
import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {GridAlignmentLayout} from "./alignments"
import type {UIElement} from "../ui/ui_element"
import type {TracksSizing, TrackSizing} from "../common/kinds"
import {GridSpacing} from "../common/kinds"
import type {CSSStyles} from "core/css"
import {px} from "core/dom"
import {Container} from "core/layout/grid"
import {enumerate} from "core/util/iterator"
import {isNumber, isString, isArray} from "core/util/types"
import type * as p from "core/properties"

const {max} = Math

export abstract class CSSGridBoxView extends LayoutDOMView {
  declare model: CSSGridBox

  override connect_signals(): void {
    super.connect_signals()
    const {spacing} = this.model.properties
    this.on_change(spacing, () => this.invalidate_layout())
  }

  get child_models(): UIElement[] {
    return this._children.map(([child]) => child)
  }

  protected override _intrinsic_display(): FullDisplay {
    return {inner: this.model.flow_mode, outer: "grid"}
  }

  protected abstract get _children(): [UIElement, number, number, number?, number?][]
  protected abstract get _rows(): TracksSizing | null
  protected abstract get _cols(): TracksSizing | null

  override _update_layout(): void {
    super._update_layout()

    const styles: CSSStyles = {}

    const [row_gap, column_gap] = (() => {
      const {spacing} = this.model
      return isNumber(spacing) ? [spacing, spacing] : spacing
    })()

    styles.row_gap = px(row_gap)
    styles.column_gap = px(column_gap)

    let nrows = 0
    let ncols = 0

    const layoutable = new Container<LayoutDOMView>()

    for (const [[, row, col, row_span = 1, col_span = 1], i] of enumerate(this._children)) {
      const view = this.child_views[i]

      nrows = max(nrows, row + row_span)
      ncols = max(ncols, col + col_span)

      // CSS grid is 1-based, but layout is 0-based
      const styles: CSSStyles = {}
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

    const {_rows: rows, _cols: cols} = this
    if (rows instanceof Map) {
      nrows = max(nrows, ...rows.keys())
    } else if (isArray(rows)) {
      nrows = max(nrows, rows.length)
    }

    if (cols instanceof Map) {
      ncols = max(ncols, ...cols.keys())
    } else if (isArray(cols)) {
      ncols = max(ncols, cols.length)
    }

    function parse_sizing(tracks: TracksSizing | null, template: TrackSizing[]): void {
      if (tracks instanceof Map) {
        for (const [i, spec] of tracks.entries()) {
          if (isString(spec)) {
            template[i].size = spec
          } else {
            template[i] = spec
          }
        }
      } else if (isArray(tracks)) {
        for (const [spec, i] of enumerate(tracks)) {
          if (isString(spec)) {
            template[i].size = spec
          } else {
            template[i] = spec
          }
        }
      } else if (tracks != null) {
        for (const row of template) {
          if (isString(tracks)) {
            row.size = tracks
          } else {
            row.size = tracks.size
            row.align = tracks.align
          }
        }
      }
    }

    const rows_template: TrackSizing[] = Array(nrows).fill(null).map(() => ({}))
    const cols_template: TrackSizing[] = Array(ncols).fill(null).map(() => ({}))

    parse_sizing(rows, rows_template)
    parse_sizing(cols, cols_template)

    for (const [[, row, col], i] of enumerate(this._children)) {
      const child = this.child_views[i]

      const {halign, valign} = child.box_sizing()
      child.style.append(":host", {
        justify_self: halign ?? cols_template[col].align,
        align_self: valign ?? rows_template[row].align,
      })
    }

    const default_size = "auto"
    styles.grid_template_rows = rows_template.map(({size}) => size ?? default_size).join(" ")
    styles.grid_template_columns = cols_template.map(({size}) => size ?? default_size).join(" ")

    this.style.append(":host", styles)

    if (layoutable.size != 0) {
      this.layout = new GridAlignmentLayout(layoutable)
      this.layout.set_sizing()
    } else {
      delete this.layout
    }
  }
}

export namespace CSSGridBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    spacing: p.Property<GridSpacing>
  }
}

export interface CSSGridBox extends CSSGridBox.Attrs {}

export abstract class CSSGridBox extends LayoutDOM {
  declare properties: CSSGridBox.Props
  declare __view_type__: CSSGridBoxView

  constructor(attrs?: Partial<CSSGridBox.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CSSGridBox.Props>(() => ({
      spacing: [ GridSpacing, 0 ],
    }))
  }
}
