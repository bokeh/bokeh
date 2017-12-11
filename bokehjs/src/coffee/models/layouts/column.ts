import {Box, BoxView} from "./box"

export class ColumnView extends BoxView {}

ColumnView.prototype.className = "bk-grid-column"

export class Column extends Box {
  _horizontal = false
}

Column.prototype.type = "Column"
Column.prototype.default_view = ColumnView
