import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {ToolbarBox, ToolbarBoxView} from "../tools/toolbar_box"
import {Toolbar} from "../tools/toolbar"
import {Grid, RowsSizing, ColsSizing, Row, Column} from "core/layout/grid"
import {Location} from "core/enums"
import {div, position} from "core/dom"
import * as p from "core/properties"

export class GridPlotView extends LayoutDOMView {
  override model: GridPlot

  protected _toolbar: ToolbarBox

  protected get _toolbar_view(): ToolbarBoxView {
    return this.child_views.find((v) => v.model == this._toolbar) as ToolbarBoxView
  }

  override initialize(): void {
    super.initialize()
    const {toolbar, toolbar_location} = this.model
    this._toolbar = new ToolbarBox({toolbar, toolbar_location: toolbar_location ?? "above"})
  }

  override connect_signals(): void {
    super.connect_signals()
    const {toolbar, toolbar_location, children, rows, cols, spacing} = this.model.properties
    this.on_change(toolbar_location, () => {
      const {toolbar_location} = this.model
      this._toolbar.toolbar_location = toolbar_location ?? "above"
    })
    this.on_change([toolbar, toolbar_location, children, rows, cols, spacing], () => {
      this.rebuild()
    })
  }

  get child_models(): LayoutDOM[] {
    return [this._toolbar, ...this.model.children.map(([child]) => child)]
  }

  protected grid: Grid
  protected grid_el: HTMLElement

  override render(): void {
    super.render()

    this.grid_el = div({style: {position: "absolute"}})
    this.shadow_el.appendChild(this.grid_el)

    for (const child_view of this.child_views) {
      if (child_view instanceof ToolbarBoxView)
        continue
      this.grid_el.appendChild(child_view.el)
    }
  }

  override update_position(): void {
    super.update_position()
    position(this.grid_el, this.grid.bbox)
  }

  override _update_layout(): void {
    const grid = this.grid = new Grid()
    grid.rows = this.model.rows
    grid.cols = this.model.cols
    grid.spacing = this.model.spacing

    for (const [child, row, col, row_span, col_span] of this.model.children) {
      const child_view = this._child_views.get(child)!
      grid.items.push({layout: child_view.layout, row, col, row_span, col_span})
    }
    grid.set_sizing(this.box_sizing())

    const {toolbar_location} = this.model
    if (toolbar_location == null)
      this.layout = grid
    else {
      this.layout = (() => {
        const tb = this._toolbar_view.layout
        switch (toolbar_location) {
          case "above": return new Column([tb, grid])
          case "below": return new Column([grid, tb])
          case "left":  return new Row([tb, grid])
          case "right": return new Row([grid, tb])
        }
      })()
      this.layout.set_sizing(this.box_sizing())
    }
  }
}

export namespace GridPlot {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    toolbar: p.Property<Toolbar>
    toolbar_location: p.Property<Location | null>
    children: p.Property<[LayoutDOM, number, number, number?, number?][]>
    rows: p.Property<RowsSizing>
    cols: p.Property<ColsSizing>
    spacing: p.Property<number | [number, number]>
  }
}

export interface GridPlot extends GridPlot.Attrs {}

export class GridPlot extends LayoutDOM {
  override properties: GridPlot.Props
  override __view_type__: GridPlotView

  constructor(attrs?: Partial<GridPlot.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = GridPlotView

    this.define<GridPlot.Props>(({Any, Int, Number, Tuple, Array, Ref, Or, Opt, Nullable}) => ({
      toolbar:          [ Ref(Toolbar), () => new Toolbar() ],
      toolbar_location: [ Nullable(Location), "above" ],
      children:         [ Array(Tuple(Ref(LayoutDOM), Int, Int, Opt(Int), Opt(Int))), [] ],
      rows:             [ Any /*TODO*/, "auto" ],
      cols:             [ Any /*TODO*/, "auto" ],
      spacing:          [ Or(Number, Tuple(Number, Number)), 0 ],
    }))
  }
}
