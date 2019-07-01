import {Box, BoxView} from "./box"
import {Column as ColumnLayout, RowsSizing} from "core/layout/grid"
import * as p from "core/properties"

export class ColumnView extends BoxView {
  model: Column

  _update_layout(): void {
    const items = this.child_views.map((child) => child.layout)
    this.layout = new ColumnLayout(items)
    this.layout.rows = this.model.rows
    this.layout.spacing = [this.model.spacing, 0]
    this.layout.set_sizing(this.box_sizing())
  }
}

export namespace Column {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Box.Props & {
    rows: p.Property<RowsSizing>
  }
}

export interface Column extends Column.Attrs {}

export class Column extends Box {
  properties: Column.Props

  constructor(attrs?: Partial<Column.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.default_view = ColumnView

    this.define<Column.Props>({
      rows: [ p.Any, "auto" ],
    })
  }
}
Column.initClass()
