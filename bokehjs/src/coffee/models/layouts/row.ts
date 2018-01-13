import {Box, BoxView} from "./box"

export class RowView extends BoxView {
  css_classes(): string[] {
    return super.css_classes().concat("bk-grid-row")
  }
}

export class Row extends Box {
  _horizontal = true
}

Row.prototype.type = "Row"
Row.prototype.default_view = RowView
