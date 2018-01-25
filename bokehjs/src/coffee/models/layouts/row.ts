import {Box, BoxView} from "./box"

export class RowView extends BoxView {
  model: Row

  css_classes(): string[] {
    return super.css_classes().concat("bk-grid-row")
  }
}

export namespace Row {
  export interface Attrs extends Box.Attrs {}
}

export interface Row extends Box, Row.Attrs {}

export class Row extends Box {

  static initClass() {
    this.prototype.type = "Row"
    this.prototype.default_view = RowView
  }

  _horizontal = true
}
Row.initClass()
