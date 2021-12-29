import {Box, BoxView} from "./box"
import * as p from "core/properties"

export class ColumnView extends BoxView {
  override model: Column
  protected _orientation = "column" as const
}

export namespace Column {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Box.Props
}

export interface Column extends Column.Attrs {}

export class Column extends Box {
  override properties: Column.Props
  override __view_type__: ColumnView

  constructor(attrs?: Partial<Column.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ColumnView
  }
}
