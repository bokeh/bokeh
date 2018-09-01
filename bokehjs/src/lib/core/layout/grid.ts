import {SizeHint, Layoutable} from "./layout_canvas"
import {isNumber, isString} from "../util/types"
import {BBox} from "../util/bbox"

const {max, round} = Math

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
  outer: BBox
  inner?: BBox
}

class GridCell {
  items: GridCellItem[] = []
}

type Matrix = GridCell[][]

type TrackSpec = {policy: "min" | "fixed"} | {policy: "flex", factor: number}

type RowSpec = {top: number,  height: number, align: TrackAlign} & TrackSpec
type ColSpec = {left: number, width:  number, align: TrackAlign} & TrackSpec

type GridState = {
  matrix: Matrix
  nrows: number
  ncols: number
  rows: RowSpec[]
  cols: ColSpec[]
}

export type TrackAlign = "start" | "center" | "end"

export type RowSizing =
  "auto" | "min" | "max" | number |
  (({policy: "auto" | "min" | "max"} |
    {policy: "flex", factor: number} |
    {policy: "fixed", height: number}) & {align?: TrackAlign})

export type ColSizing =
  "auto" | "min" | "max" | number |
  (({policy: "auto" | "min" | "max"} |
    {policy: "flex", factor: number} |
    {policy: "fixed", width: number})  & {align?: TrackAlign})

export class Grid extends Layoutable {

  items: GridItem[] = []

  rows: {[key: number]: RowSizing} = {}
  cols: {[key: number]: ColSizing} = {}

  private state: GridState

  size_hint(): SizeHint {
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
      const size_hint = layout.size_hint()
      matrix[y][x].items.push({layout, size_hint, outer: new BBox()})
    }

    const rows: RowSpec[] = new Array(nrows)
    for (let y = 0; y < nrows; y++) {
      let row = this.rows[y]

      if (row == null) {
        let height_policy: "min" | "max"

        if (this.sizing.height_policy == "max")
          height_policy = "max"
        else {
          height_policy = "min"

          row_auto: for (let x = 0; x < ncols; x++) {
            const cell = matrix[y][x]
            for (let i = 0; i < cell.items.length; i++) {
              const {sizing} = cell.items[i].layout

              if (sizing.height_policy != "min") {
                height_policy = "max"
                break row_auto
              }
            }
          }
        }

        row = {policy: height_policy}
      } else if (isNumber(row)) {
        row = {policy: "fixed", height: row}
      } else if (isString(row)) {
        row = {policy: row}
      }

      const align = row.align || "start"
      const top = 0

      if (row.policy == "fixed")
        rows[y] = {align, top, height: row.height, policy: "fixed"}
      else if (row.policy == "min")
        rows[y] = {align, top, height: 0, policy: "min"}
      else if (row.policy == "max")
        rows[y] = {align, top, height: 0, policy: "flex", factor: 1}
      else if (row.policy == "flex")
        rows[y] = {align, top, height: 0, policy: "flex", factor: row.factor}
    }

    const cols: ColSpec[] = new Array(ncols)
    for (let x = 0; x < ncols; x++) {
      let col = this.cols[x]

      if (col == null) {
        let width_policy: "min" | "max"

        if (this.sizing.width_policy == "max")
          width_policy = "max"
        else {
          width_policy = "min"

          col_auto: for (let y = 0; y < nrows; y++) {
            const cell = matrix[y][x]
            for (let i = 0; i < cell.items.length; i++) {
              const {sizing} = cell.items[i].layout

              if (sizing.width_policy != "max") {
                width_policy = "max"
                break col_auto
              }
            }
          }
        }

        col = {policy: width_policy}
      } else if (isNumber(col)) {
        col = {policy: "fixed", width: col}
      } else if (isString(col)) {
        col = {policy: col}
      }

      const align = col.align || "start"
      const left = 0

      if (col.policy == "fixed")
        cols[x] = {align, left, width: col.width, policy: "fixed"}
      else if (col.policy == "min")
        cols[x] = {align, left, width: 0, policy: "min"}
      else if (col.policy == "max")
        cols[x] = {align, left, width: 0, policy: "flex", factor: 1}
      else if (col.policy == "flex")
        cols[x] = {align, left, width: 0, policy: "flex", factor: col.factor}
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

    for (let y = 0, top = 0; y < nrows; y++) {
      const row = rows[y]
      if (row.policy == "flex")
        row.height = round(available_height * (row.factor/total_row_flex))
      row.top = top
      top += row.height
    }

    for (let x = 0, left = 0; x < ncols; x++) {
      const col = cols[x]
      if (col.policy == "flex")
        col.width = round(available_width * (col.factor/total_col_flex))
      col.left = left
      left += col.width
    }

    for (let y = 0; y < nrows; y++) {
      const row = rows[y]
      for (let x = 0; x < ncols; x++) {
        const col = cols[x]
        const cell = matrix[y][x]
        for (let i = 0; i < cell.items.length; i++) {
          const item = cell.items[i]
          const {sizing} = item.layout

          let width: number
          if (sizing.width_policy == "fixed")
            width = sizing.width
          else if (sizing.width_policy == "min")
            width = item.size_hint.width
          else if (sizing.width_policy == "max")
            width = col.width
          else if (sizing.width_policy == "auto") {
            if (col.policy == "flex" || sizing.width == null)
              width = col.width
            else
              width = sizing.width
          } else
            throw new Error("unreachable")

          let height: number
          if (sizing.height_policy == "fixed")
            height = sizing.height
          else if (sizing.height_policy == "min")
            height = item.size_hint.height
          else if (sizing.height_policy == "max")
            height = row.height
          else if (sizing.height_policy == "auto") {
            if (row.policy == "flex" || sizing.height == null)
              height = row.height
            else
              height = sizing.height
          } else
            throw new Error("unreachable")

          let left = col.left
          if (width != col.width) {
            if (col.align == "start")
              left += 0
            else if (col.align == "center")
              left += round((col.width - width)/2)
            else if (col.align == "end")
              left += col.width - width
          }

          let top = row.top
          if (height != row.height) {
            if (row.align == "start")
              top += 0
            else if (row.align == "center")
              top += round((row.height - height)/2)
            else if (row.align == "end")
              top += row.height - height
          }

          item.outer = new BBox({left, top, width, height})
        }
      }
    }

    for (let x = 0; x < ncols; x++) {
      const col = cols[x]

      let left = 0
      let right = 0

      const left_items = new Set<GridCellItem>()
      const right_items = new Set<GridCellItem>()

      for (let y = 0; y < nrows; y++) {
        const cell = matrix[y][x]
        for (let i = 0; i < cell.items.length; i++) {
          const item = cell.items[i]

          if (item.size_hint.inner != null) {
            if (item.outer.width != col.width) {
              if (col.align == "start") {
                left = max(left, item.size_hint.inner.left)
                left_items.add(item)
              } else if (col.align == "end") {
                right = max(right, item.size_hint.inner.right)
                right_items.add(item)
              }
            } else {
              left = max(left, item.size_hint.inner.left)
              right = max(right, item.size_hint.inner.right)
              left_items.add(item)
              right_items.add(item)
            }
          }
        }
      }

      for (let y = 0; y < nrows; y++) {
        const cell = matrix[y][x]
        for (let i = 0; i < cell.items.length; i++) {
          const item = cell.items[i]

          if (item.size_hint.inner != null) {
            const inner_left = left_items.has(item) ? left : item.size_hint.inner.left
            const inner_right = right_items.has(item) ? right : item.size_hint.inner.right

            item.inner = new BBox({
              left: inner_left,
              top: 0,
              right: item.outer.width - inner_right,
              bottom: 0,
            })
          }
        }
      }
    }

    for (let y = 0; y < nrows; y++) {
      const row = rows[y]

      let top = 0
      let bottom = 0

      const top_items = new Set<GridCellItem>()
      const bottom_items = new Set<GridCellItem>()

      for (let x = 0; x < ncols; x++) {
        const cell = matrix[y][x]
        for (let i = 0; i < cell.items.length; i++) {
          const item = cell.items[i]

          if (item.size_hint.inner != null) {
            if (item.outer.height != row.height) {
              if (row.align == "start") {
                top = max(top, item.size_hint.inner.top)
                top_items.add(item)
              } else if (row.align == "end") {
                bottom = max(bottom, item.size_hint.inner.bottom)
                bottom_items.add(item)
              }
            } else {
              top = max(top, item.size_hint.inner.top)
              bottom = max(bottom, item.size_hint.inner.bottom)
              top_items.add(item)
              bottom_items.add(item)
            }
          }
        }
      }

      for (let x = 0; x < ncols; x++) {
        const cell = matrix[y][x]
        for (let i = 0; i < cell.items.length; i++) {
          const item = cell.items[i]

          if (item.size_hint.inner != null) {
            const inner_top = top_items.has(item) ? top : item.size_hint.inner.top
            const inner_bottom = bottom_items.has(item) ? bottom : item.size_hint.inner.bottom

            item.inner = new BBox({
              left: item.inner!.left,
              top: inner_top,
              right: item.inner!.right,
              bottom: item.outer.height - inner_bottom,
            })
          }
        }
      }
    }

    for (let y = 0; y < nrows; y++) {
      for (let x = 0; x < ncols; x++) {
        const cell = matrix[y][x]
        for (let i = 0; i < cell.items.length; i++) {
          const item = cell.items[i]
          item.layout.set_geometry(item.outer, item.inner)
        }
      }
    }
  }
}

export class Row extends Grid {
  constructor(items: Layoutable[]) {
    super()
    this.items = items.map((item, i) => {
      return {layout: item, row: 0, col: i}
    })
  }
}

export class Column extends Grid {
  constructor(items: Layoutable[]) {
    super()
    this.items = items.map((item, i) => {
      return {layout: item, row: i, col: 0}
    })
  }
}
