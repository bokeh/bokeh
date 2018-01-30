import {Box, BoxView} from "./box"

export class RowView extends BoxView {
  model: Row

  css_classes(): string[] {
    return super.css_classes().concat("bk-grid-row")
  }
}

export namespace Row {
  export interface Attrs extends Box.Attrs {}

  export interface Opts extends Box.Opts {}
}

export interface Row extends Row.Attrs {}

export class Row extends Box {

  constructor(attrs?: Partial<Row.Attrs>, opts?: Row.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "Row"
    this.prototype.default_view = RowView
  }

  _horizontal = true
}
Row.initClass()
