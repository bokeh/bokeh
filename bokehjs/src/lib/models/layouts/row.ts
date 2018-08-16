import {Box, BoxView} from "./box"

export class RowView extends BoxView {
  model: Row

  update_layout(): void {
    super.update_layout()

    const {child_views} = this
    for (let i = 0; i < child_views.length; i++) {
      this.layout.items.push({layout: child_views[i].layout, row: 0, col: i})
    }
  }
}

export namespace Row {
  export interface Attrs extends Box.Attrs {}

  export interface Props extends Box.Props {}
}

export interface Row extends Row.Attrs {}

export class Row extends Box {
  properties: Row.Props

  constructor(attrs?: Partial<Row.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Row"
    this.prototype.default_view = RowView
  }
}
Row.initClass()
