export {describe, it, display} from "../framework"

import {Matrix} from "@bokehjs/core/util/matrix"
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

// TODO: this was copied from `integration/_interactive.ts`. Allow sharing this kind
// of utility code between test suites in the future.
import {MouseButton} from "@bokehjs/core/dom"
import {delay} from "@bokehjs/core/util/defer"

export async function click(el: Element): Promise<void> {
  const ev0 = new PointerEvent("pointerdown", {pressure: 0.5, buttons: MouseButton.Left, bubbles: true})
  el.dispatchEvent(ev0)

  await delay(10)

  const ev1 = new PointerEvent("pointerup", {bubbles: true})
  el.dispatchEvent(ev1)
}
