import {Box, BoxView} from "./box"

export class RowView extends BoxView {
  css_classes(): string[] {
    return super.css_classes().concat("bk-grid-row")
  }
}

export class Row extends Box {

  static initClass() {
    this.prototype.type = "Row"
    this.prototype.default_view = RowView
  }

  _horizontal = true
}

Row.initClass()
