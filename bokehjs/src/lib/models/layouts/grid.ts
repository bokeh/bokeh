/*
import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {SizeHint, BBox} from "core/layout"
import * as p from "core/properties"

export interface Geom {
  outer: {}
  inner?: {}
}

export interface GridItemSpec {
  item: LayoutDOM
  row: number
  col: number
  row_span: number
  col_span: number
}

export interface GridItem {
  item: LayoutDOMView
  row: number
  col: number
  end_row: number // row + row_span - 1
  end_col: number // col + col_span - 1
}

export class GridBoxView extends LayoutDOMView {
  model: GridBox

  _build_grid(): void {
    const row_sizes = []
    const col_sizes = []

    for (const child_view of this.get_layoutable_views()) {

    }
  }

  size_hint(): SizeHint {
    const size_hints = {[key: string]: SizeHint}

    for (const child_view of this.get_layoutable_views()) {
      size_hints[child_view.id] = child_view.size_hint()
    }

    //build_grid

    return {width: 0, height: 0}
  }

  _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)
  }
}

export namespace GridBox {
  export interface Attrs extends LayoutDOM.Attrs {
    rows: number | string | (number | string)[] | null
    cols: number | string | (number | string)[] | null
    children: [LayoutDOM, number, number, number, number][] // obj, row, col, row_span, col_span
    spacing: number | [number, number]
  }

  export interface Props extends LayoutDOM.Props {
    children: p.Property<[LayoutDOM, number, number, number, number][]>
    spacing: p.Property<number | [number, number]>
  }
}

export interface GridBox extends GridBox.Attrs {}

export class GridBox extends LayoutDOM {
  properties: GridBox.Props

  constructor(attrs?: Partial<GridBox.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "GridBox"
    this.prototype.default_view = GridBoxView

    this.define({
      children: [ p.Array, [] ],
      spacing: [ p.Any, 0 ],
    })
  }
}
GridBox.initClass()
*/
