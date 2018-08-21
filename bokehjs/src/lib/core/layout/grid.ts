import {SizeHint, Layoutable} from "./layout_canvas"
import {BBox} from "../util/bbox"

const {max} = Math

export type GridItem = {
  layout: Layoutable
  row: number
  col: number
  //row_span?: number
  //col_span?: number
}

type GridCellItem = {
  layout: Layoutable
  size_hint: SizeHint
  box: {left: number, top: number, width: number, height: number}
  inner_box: {left: number, top: number, right: number, bottom: number}
}

class GridCell {
  items: GridCellItem[] = []
}

type Matrix = GridCell[][]

type TrackSpec = {policy: "min" | "fixed"} | {policy: "flex", factor: number}

type RowSpec = {height: number} & TrackSpec
type ColSpec = {width:  number} & TrackSpec

type GridState = {
  matrix: Matrix
  nrows: number
  ncols: number
  rows: RowSpec[]
  cols: ColSpec[]
}

export type RowSizing =
  {policy: "auto" | "min" | "max"} | {policy: "flex", factor: number} | {policy: "fixed", height: number}
export type ColSizing =
  {policy: "auto" | "min" | "max"} | {policy: "flex", factor: number} | {policy: "fixed", width: number}

export class Grid extends Layoutable {

  items: GridItem[] = []

  rows: {[key: number]: RowSizing} = {}
  cols: {[key: number]: ColSizing} = {}

  private state: GridState

  size_hint(): SizeHint {
    if (this.items.length == 0)
      return {width: 0, height: 0}

    let nrows = 0
    let ncols = 0

    for (const {row, col} of this.items) {
      nrows = max(nrows, row)
      ncols = max(ncols, col)
    }

    nrows += 1
    ncols += 1

    const matrix: Matrix = new Array(nrows)
    for (let y = 0; y < nrows; y++) {
      matrix[y] = new Array(ncols)
      for (let x = 0; x < ncols; x++) {
        matrix[y][x] = new GridCell()
      }
    }

    for (const {layout, row: y, col: x} of this.items) {
      matrix[y][x].items.push({
        layout,
        size_hint: layout.size_hint(),
        box: {left: 0, top: 0, width: 0, height: 0},
        inner_box: {left: 0, top: 0, right: 0, bottom: 0},
      })
    }

    const rows: RowSpec[] = new Array(nrows)
    for (let y = 0; y < nrows; y++) {
      let row = this.rows[y]

      if (row == null) {
        let min_policy = true
        row_auto: for (let x = 0; x < ncols; x++) {
          const cell = matrix[y][x]
          for (let i = 0; i < cell.items.length; i++) {
            const policy = cell.items[i].layout.sizing.height_policy
            if (!(policy == "min" || policy == "fixed")) {
              min_policy = false
              break row_auto
            }
          }
        }

        row = {policy: min_policy ? "min" : "max"}
      }

      if (row.policy == "fixed")
        rows[y] = {height: row.height, policy: "fixed"}
      else if (row.policy == "min")
        rows[y] = {height: 0, policy: "min"}
      else if (row.policy == "max")
        rows[y] = {height: 0, policy: "flex", factor: 1}
      else if (row.policy == "flex")
        rows[y] = {height: 0, policy: "flex", factor: row.factor}
    }

    const cols: ColSpec[] = new Array(ncols)
    for (let x = 0; x < ncols; x++) {
      let col = this.cols[x]

      if (col == null) {
        let min_policy = true
        col_auto: for (let y = 0; y < nrows; y++) {
          const cell = matrix[y][x]
          for (let i = 0; i < cell.items.length; i++) {
            const policy = cell.items[i].layout.sizing.width_policy
            if (!(policy == "min" || policy == "fixed")) {
              min_policy = false
              break col_auto
            }
          }
        }

        col = {policy: min_policy ? "min" : "max"}
      }

      if (col.policy == "fixed")
        cols[x] = {width: col.width, policy: "fixed"}
      else if (col.policy == "min")
        cols[x] = {width: 0, policy: "min"}
      else if (col.policy == "max")
        cols[x] = {width: 0, policy: "flex", factor: 1}
      else if (col.policy == "flex")
        cols[x] = {width: 0, policy: "flex", factor: col.factor}
    }

    for (let y = 0; y < nrows; y++) {
      for (let x = 0; x < ncols; x++) {
        const cell = matrix[y][x]
        const col = cols[x]
        if (col.policy != "fixed") {
          for (let i = 0; i < cell.items.length; i++) {
            const item = cell.items[i]
            col.width = max(col.width, item.size_hint.width)
          }
        }
      }
    }

    for (let x = 0; x < ncols; x++) {
      for (let y = 0; y < nrows; y++) {
        const cell = matrix[y][x]
        const row = rows[y]
        if (row.policy != "fixed") {
          for (let i = 0; i < cell.items.length; i++) {
            const item = cell.items[i]
            row.height = max(row.height, item.size_hint.height)
          }
        }
      }
    }

    let height = 0
    if (this.sizing.height_policy == "fixed")
      height = this.sizing.height
    else {
      for (let y = 0; y < nrows; y++) {
        height += rows[y].height
      }
    }

    let width = 0
    if (this.sizing.width_policy == "fixed")
      width = this.sizing.width
    else {
      for (let x = 0; x < ncols; x++) {
        width += cols[x].width
      }
    }

    this.state = {matrix, nrows, ncols, rows, cols}

    return {width, height}
  }

  protected _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    const {matrix, nrows, ncols, rows, cols} = this.state

    const {width, height} = outer

    let available_width = width
    let available_height = height

    let total_row_flex = 0
    let total_col_flex = 0

    for (let y = 0; y < nrows; y++) {
      const row = rows[y]
      if (row.policy == "fixed" || row.policy == "min")
        available_height -= row.height
      else if (row.policy == "flex")
        total_row_flex += row.factor
    }

    for (let x = 0; x < ncols; x++) {
      const col = cols[x]
      if (col.policy == "fixed" || col.policy == "min")
        available_width -= col.width
      else if (col.policy == "flex")
        total_col_flex += col.factor
    }

    if (available_width < 0)
      available_width = 0
    if (available_height < 0)
      available_height = 0

    for (let y = 0; y < nrows; y++) {
      const row = rows[y]
      if (row.policy == "flex")
        row.height = available_height * (row.factor/total_row_flex)
    }

    for (let x = 0; x < ncols; x++) {
      const col = cols[x]
      if (col.policy == "flex")
        col.width = available_width * (col.factor/total_col_flex)
    }

    for (let y = 0, top = 0; y < nrows; y++) {
      const row = rows[y]
      for (let x = 0, left = 0; x < ncols; x++) {
        const col = cols[x]
        const cell = matrix[y][x]
        for (let i = 0; i < cell.items.length; i++) {
          const item = cell.items[i]

          item.box.left = left
          item.box.top = top

          const {sizing} = item.layout

          if (sizing.width_policy == "fixed")
            item.box.width = sizing.width
          else if (sizing.width_policy == "min")
            item.box.width = item.size_hint.width
          else if (sizing.width_policy == "max")
            item.box.width = col.width
          else if (sizing.width_policy == "auto") {
            if (sizing.width != null)
              item.box.width = sizing.width
            else
              item.box.width = col.width
          }

          if (sizing.height_policy == "fixed")
            item.box.height = sizing.height
          else if (sizing.height_policy == "min")
            item.box.height = item.size_hint.height
          else if (sizing.height_policy == "max")
            item.box.height = row.height
          else if (sizing.height_policy == "auto") {
            if (sizing.height != null)
              item.box.height = sizing.height
            else
              item.box.height = row.height
          }
        }
        left += col.width
      }
      top += row.height
    }

    for (let y = 0; y < nrows; y++) {
      for (let x = 0; x < ncols; x++) {
        const cell = matrix[y][x]
        for (let i = 0; i < cell.items.length; i++) {
          const item = cell.items[i]

          if (item.size_hint.inner != null) {
            const {box} = item
            const {inner} = item.size_hint
            item.inner_box = {
              left: inner.left,
              top: inner.top,
              right: box.width - inner.right,
              bottom: box.height - inner.bottom,
            }
          }
        }
      }
    }

    for (let y = 0; y < nrows; y++) {
      for (let x = 0; x < ncols; x++) {
        const cell = matrix[y][x]
        for (let i = 0; i < cell.items.length; i++) {
          const item = cell.items[i]
          item.layout.set_geometry(new BBox(item.box), new BBox(item.inner_box))
        }
      }
    }
  }
}
