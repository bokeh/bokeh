import {LayoutableRenderer, LayoutableRendererView} from "./layoutable_renderer"
import type {RowsSizing, ColsSizing} from "core/layout/grid"
import {Grid} from "core/layout/grid"
import {zip} from "core/util/iterator"
import type * as p from "core/properties"

export class GridRendererView extends LayoutableRendererView {
  declare model: GridRenderer
  declare layout: Grid

  get renderers(): LayoutableRenderer[] {
    return this.model.items.map(([renderer]) => renderer)
  }

  get layoutables(): LayoutableRenderer[] {
    return this.renderers
  }

  /*
  override connect_signals(): void {
    super.connect_signals()
    const {children, rows, cols, spacing} = this.model.properties
    this.on_change([children, rows, cols, spacing], () => this.rebuild())
  }
  */

  override _update_layout(): void {
    this.layout = new Grid()
    this.layout.absolute = true

    this.layout.rows = this.model.rows
    this.layout.cols = this.model.cols
    this.layout.spacing = this.model.spacing

    for (const [[, row, col, row_span, col_span], rv] of zip(this.model.items, this.layoutable_views)) {
      this.layout.items.push({layout: rv.layout, row, col, row_span, col_span})
    }

    this.layout.set_sizing()
  }

  override _after_layout(): void {}

  override _render(): void {
    for (const renderer_view of this.layoutable_views) {
      renderer_view.render()
    }
  }
}

export namespace GridRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutableRenderer.Props & {
    items: p.Property<[LayoutableRenderer, number, number, number?, number?][]>
    rows: p.Property<RowsSizing>
    cols: p.Property<ColsSizing>
    spacing: p.Property<number | [number, number]>
  }
}

export interface GridRenderer extends GridRenderer.Attrs {}

export class GridRenderer extends LayoutableRenderer {
  declare properties: GridRenderer.Props
  declare __view_type__: GridRendererView

  constructor(attrs?: Partial<GridRenderer.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = GridRendererView

    this.define<GridRenderer.Props>(({Any, Int, Number, Tuple, Array, Ref, Or, Opt}) => ({
      items: [ Array(Tuple(Ref(LayoutableRenderer), Int, Int, Opt(Int), Opt(Int))), [] ],
      rows: [ Any /*TODO*/, "auto" ],
      cols: [ Any /*TODO*/, "auto" ],
      spacing: [ Or(Number, Tuple(Number, Number)), 0 ],
    }))
  }
}
