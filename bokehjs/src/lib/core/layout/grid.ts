import {SizeHint, Layoutable} from "./layout_canvas"
import {BBox} from "../util/bbox"

export type GridItem = {
  layout: Layoutable
  row: number
  col: number
  row_span?: number
  col_span?: number
}

//export type RowSpec = number |

export class Grid extends Layoutable {

  items: GridItem[] = []

  //rows?: {[key: number}: RowSpec}

  //cols?: {[key: number}:

  size_hint(): SizeHint {
    let width = 0
    let height = 0

    for (const item of this.items) {
      const size_hint = item.layout.size_hint()
    }

    return {width, height}
  }

  protected _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)
  }
}
