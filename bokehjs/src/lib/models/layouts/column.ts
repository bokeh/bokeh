import {Box, BoxView} from "./box"

export class ColumnView extends BoxView {
  model: Column
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
