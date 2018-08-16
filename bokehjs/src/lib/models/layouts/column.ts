import {Box, BoxView} from "./box"

export class ColumnView extends BoxView {
  model: Column

  update_layout(): void {
    super.update_layout()

    const {child_views} = this
    for (let i = 0; i < child_views.length; i++) {
      this.layout.items.push({layout: child_views[i].layout, row: i, col: 0})
    }
  }
}

export namespace Column {
  export interface Attrs extends Box.Attrs {}

  export interface Props extends Box.Props {}
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
  }
}
Column.initClass()
