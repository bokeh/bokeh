import {Box, BoxView} from "./box"
import {ColSizing} from "core/layout/grid"
import * as p from "core/properties"

export class RowView extends BoxView {
  model: Row

  _update_layout(): void {
    super._update_layout()
    this.layout.rows = "fit"
    this.layout.cols = this.model.cols
    this.layout.spacing = [this.model.spacing, 0]

    const {child_views} = this
    for (let i = 0; i < child_views.length; i++) {
      this.layout.items.push({layout: child_views[i].layout, row: 0, col: i})
    }
  }
}

export namespace Row {
  export interface Attrs extends Box.Attrs {
    cols: {[key: number]: ColSizing}
  }

  export interface Props extends Box.Props {
    cols: p.Property<{[key: number]: ColSizing}>
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

    this.define({
      cols: [ p.Any, "auto" ],
    })
  }
}
Row.initClass()
