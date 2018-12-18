import {Box, BoxView} from "./box"
import {RowSizing} from "core/layout/grid"
import * as p from "core/properties"

export class ColumnView extends BoxView {
  model: Column

  _update_layout(): void {
    super._update_layout()
    this.layout.rows = this.model.rows
    this.layout.cols = "fit"
    this.layout.spacing = [0, this.model.spacing]

    const {child_views} = this
    for (let i = 0; i < child_views.length; i++) {
      this.layout.items.push({layout: child_views[i].layout, row: i, col: 0})
    }
  }
}

export namespace Column {
  export interface Attrs extends Box.Attrs {
    rows: {[key: number]: RowSizing}
  }

  export interface Props extends Box.Props {
    rows: p.Property<{[key: number]: RowSizing}>
  }
}

export interface Column extends Column.Attrs {}

export class Column extends Box {
  properties: Column.Props

  constructor(attrs?: Partial<Column.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Column"
    this.prototype.default_view = ColumnView

    this.define({
      rows: [ p.Any, "auto" ],
    })
  }
}
Column.initClass()
