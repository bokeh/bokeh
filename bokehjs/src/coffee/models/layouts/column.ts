import {Box, BoxView} from "./box"

export class ColumnView extends BoxView {
  css_classes(): string[] {
    return super.css_classes().concat("bk-grid-column")
  }
}

export class Column extends Box {

  static initClass() {
    this.prototype.type = "Column"
    this.prototype.default_view = ColumnView
  }

  _horizontal = false
}

Column.initClass()
