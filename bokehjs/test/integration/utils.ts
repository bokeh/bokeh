export {describe, it, display} from "../framework"

import {Matrix} from "@bokehjs/core/util/data_structures"
import {Figure, figure} from "@bokehjs/api/plotting"
import {LayoutDOM, Row, Column, GridBox} from "@bokehjs/models/layouts/index"

export function grid(items: Matrix<LayoutDOM> | LayoutDOM[][], opts?: Partial<GridBox.Attrs>): GridBox {
  const children = Matrix.from(items).to_sparse()
  return new GridBox({...opts, children})
}

export function row(children: LayoutDOM[], opts?: Partial<Row.Attrs>): Row {
  return new Row({...opts, children})
}

export function column(children: LayoutDOM[], opts?: Partial<Column.Attrs>): Column {
  return new Column({...opts, children})
}

export function fig([width, height]: [number, number], attrs?: Partial<Figure.Attrs>): Figure {
  return figure({width, height, title: null, toolbar_location: null, ...attrs})
}
