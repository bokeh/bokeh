import {Box, BoxView} from "./box"
import {Row as RowLayout, ColsSizing} from "core/layout/grid"
import * as p from "core/properties"

export class RowView extends BoxView {
  model: Row

  _update_layout(): void {
    const items = this.child_views.map((child) => child.layout)
    this.layout = new RowLayout(items)
    this.layout.cols = this.model.cols
    this.layout.spacing = [this.model.spacing, 0]
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
  properties: Row.Props

  constructor(attrs?: Partial<Row.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Row"
    this.prototype.default_view = RowView

    this.define<Row.Props>({
      cols: [ p.Any, "auto" ],
    })
  }
}
Row.initClass()
