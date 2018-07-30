import {Box, BoxView} from "./box"

export class RowView extends BoxView {
  model: Row
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
