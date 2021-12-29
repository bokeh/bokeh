import {Box, BoxView} from "./box"
import * as p from "core/properties"

export class RowView extends BoxView {
  override model: Row
  protected _orientation = "row" as const
}

export namespace Row {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Box.Props
}

export interface Row extends Row.Attrs {}

export class Row extends Box {
  override properties: Row.Props
  override __view_type__: RowView

  constructor(attrs?: Partial<Row.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = RowView
  }
}
