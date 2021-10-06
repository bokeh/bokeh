import {Box, BoxView} from "./box"
import {Row as RowLayout, ColsSizing} from "core/layout/grid"
import * as p from "core/properties"

export class RowView extends BoxView {
  override model: Row

  override _update_layout(): void {
    const items = this.child_views.map((child) => child.layout)
    this.layout = new RowLayout(items)
    this.layout.cols = this.model.cols
    this.layout.spacing = [0, this.model.spacing]
    this.layout.set_sizing(this.box_sizing())
  }
}

export namespace Row {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Box.Props & {
    cols: p.Property<ColsSizing>
  }
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

    this.define<Row.Props>(({Any}) => ({
      cols: [ Any /*TODO*/, "auto" ],
    }))
  }
}
