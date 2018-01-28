import {Box, BoxView} from "./box"

export class ColumnView extends BoxView {
  model: Column

  css_classes(): string[] {
    return super.css_classes().concat("bk-grid-column")
  }
}

export namespace Column {
  export interface Attrs extends Box.Attrs {}

  export interface Opts extends Box.Opts {}
}

export interface Column extends Column.Attrs {}

export class Column extends Box {

  constructor(attrs?: Partial<Column.Attrs>, opts?: Column.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "Column"
    this.prototype.default_view = ColumnView
  }

  _horizontal = false
}
Column.initClass()
