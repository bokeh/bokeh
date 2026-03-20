import {Matrix} from "@bokehjs/core/util/matrix"
import type {UIElement} from "@bokehjs/models/ui/ui_element"
import {Row, Column, GridBox} from "@bokehjs/models/layouts/index"
import type {Figure} from "@bokehjs/api/plotting"
import {figure} from "@bokehjs/api/plotting"

export {display} from "./display"

export function fig([width, height]: [number, number], attrs?: Partial<Figure.Attrs>): Figure {
  return figure({width, height, title: null, toolbar_location: null, ...attrs})
}

export function grid(items: Matrix<UIElement> | UIElement[][], opts?: Partial<GridBox.Attrs>): GridBox {
  const children = Matrix.from(items).to_sparse()
  return new GridBox({...opts, children})
}

export function row(children: UIElement[], opts?: Partial<Row.Attrs>): Row {
  return new Row({...opts, children})
}

export function column(children: UIElement[], opts?: Partial<Column.Attrs>): Column {
  return new Column({...opts, children})
}
