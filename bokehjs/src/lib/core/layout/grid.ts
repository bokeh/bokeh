import {SizeHint, Layoutable} from "./layoutable"
import {isNumber, isString, isObject} from "../util/types"
import {Set} from "core/util/data_structures"
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

type TrackSpec = {policy: "min" | "fit" | "fixed"} | {policy: "flex", factor: number}

type RowSpec = {top: number,  height: number, align: TrackAlign} & TrackSpec
type ColSpec = {left: number, width:  number, align: TrackAlign} & TrackSpec

type GridState = {
  matrix: Matrix
  nrows: number
  ncols: number
  rows: RowSpec[]
  cols: ColSpec[]
  hspacing: number
  vspacing: number
}

export type TrackAlign = "start" | "center" | "end"

export type QuickTrackSizing = "auto" | "fit" | "min" | "max" | number

export type RowSizing =
  QuickTrackSizing |
  (({policy: "auto" | "fit" | "min" | "max"} |
    {policy: "flex", factor: number} |
    {policy: "fixed", height: number}) & {align?: TrackAlign})

export type ColSizing =
  QuickTrackSizing |
  (({policy: "auto" | "fit" | "min" | "max"} |
    {policy: "flex", factor: number} |
    {policy: "fixed", width: number})  & {align?: TrackAlign})

export class Grid extends Layoutable {

  items: GridItem[] = []

  rows: QuickTrackSizing | {[key: number]: RowSizing} = "auto"
  cols: QuickTrackSizing | {[key: number]: ColSizing} = "auto"

  spacing: number | [number, number] = 0

  absolute: boolean = false

  private _state: GridState

  constructor(items: GridItem[] = []) {
    super()
    this.items = items
  }

  /*
  has_hfw(): boolean {
    if (super.has_hfw())
      return true

    for (const {layout} of this.items) {
      if (layout.has_hfw())
        return true
    }

    return false
  }
  */

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
      let row = isObject(this.rows) ? this.rows[y] : this.rows

      if (row == null) {
        row = {policy: "auto"}
      } else if (isNumber(row)) {
        row = {policy: "fixed", height: row}
      } else if (isString(row)) {
        row = {policy: row}
      }

      if (row.policy == "auto") {
        row_auto: for (let x = 0; x < ncols; x++) {
          const cell = matrix[y][x]
          for (let i = 0; i < cell.items.length; i++) {
            const {sizing} = cell.items[i].layout

            if (sizing.height_policy == "max") {
              row = {policy: "max"}
              break row_auto
            }
          }
        }
      }

      const align = row.align || "start"
      const top = 0
      const height = 0

      if (row.policy == "fixed")
        rows[y] = {align, top, height: row.height, policy: "fixed"}
      else if (row.policy == "fit")
        rows[y] = {align, top, height, policy: "fit"}
      else if (row.policy == "min" || row.policy == "auto")
        rows[y] = {align, top, height, policy: "min"}
      else if (row.policy == "max")
        rows[y] = {align, top, height, policy: "flex", factor: 1}
      else if (row.policy == "flex")
        rows[y] = {align, top, height, policy: "flex", factor: row.factor}
    }

    const cols: ColSpec[] = new Array(ncols)
    for (let x = 0; x < ncols; x++) {
      let col = isObject(this.cols) ? this.cols[x] : this.cols

      if (col == null) {
        col = {policy: "auto"}
      } else if (isNumber(col)) {
        col = {policy: "fixed", width: col}
      } else if (isString(col)) {
        col = {policy: col}
      }

      if (col.policy == "auto") {
        col_auto: for (let y = 0; y < nrows; y++) {
          const cell = matrix[y][x]
          for (let i = 0; i < cell.items.length; i++) {
            const {sizing} = cell.items[i].layout

            if (sizing.width_policy == "max") {
              col = {policy: "max"}
              break col_auto
            }
          }
        }
      }

      const align = col.align || "start"
      const left = 0
      const width = 0

      if (col.policy == "fixed")
        cols[x] = {align, left, width: col.width, policy: "fixed"}
      else if (col.policy == "fit")
        cols[x] = {align, left, width, policy: "fit"}
      else if (col.policy == "min" || col.policy == "auto")
        cols[x] = {align, left, width, policy: "min"}
      else if (col.policy == "max")
        cols[x] = {align, left, width, policy: "flex", factor: 1}
      else if (col.policy == "flex")
        cols[x] = {align, left, width, policy: "flex", factor: col.factor}
    }

    for (let y = 0; y < nrows; y++) {
      for (let x = 0; x < ncols; x++) {
        const cell = matrix[y][x]
        const col = cols[x]
        if (col.policy != "fixed") {
          for (let i = 0; i < cell.items.length; i++) {
            const item = cell.items[i]
            const {left, right} = item.layout.sizing.margin
            col.width = max(col.width, left + item.size_hint.width + right)
          }
        }
      }
    }

    for (let x = 0; x < ncols; x++) {
      const col = cols[x]
      for (let y = 0; y < nrows; y++) {
        const cell = matrix[y][x]
        const row = rows[y]
        if (row.policy != "fixed") {
          for (let i = 0; i < cell.items.length; i++) {
            const item = cell.items[i]
            const {top, bottom} = item.layout.sizing.margin
            row.height = max(row.height, top + item.size_hint.height + bottom)

            if (item.layout.has_hfw()) {
              const hfw_height = top + item.layout.hfw(col.width) + bottom
              row.height = max(row.height, hfw_height)
            }
          }
        }
      }
    }

    const [hspacing, vspacing] =
      isNumber(this.spacing) ? [this.spacing, this.spacing] : this.spacing

    let min_height = 0
    let height_expanding = false
    for (let y = 0; y < nrows; y++) {
      min_height += rows[y].height
      if (rows[y].policy == "flex")
        height_expanding = true
    }
    min_height += (nrows - 1)*vspacing

    let min_width = 0
    let width_expanding = false
    for (let x = 0; x < ncols; x++) {
      min_width += cols[x].width
      if (cols[x].policy == "flex")
        width_expanding = true
    }
    min_width += (ncols - 1)*hspacing

    let height: number
    if (this.sizing.height_policy == "fixed")
      height = this.sizing.height != null ? this.sizing.height : min_height
    else
      height = min_height

    let width: number
    if (this.sizing.width_policy == "fixed")
      width = this.sizing.width != null ? this.sizing.width : min_width
    else
      width = min_width

    this._state = {matrix, nrows, ncols, rows, cols, hspacing, vspacing}

    return {width, height, width_expanding, height_expanding}
  }

  protected _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    const {matrix, nrows, ncols, rows, cols, hspacing, vspacing} = this._state

    const {width, height} = outer

    let available_width = width
    let available_height = height

    let row_flex = 0
    let col_flex = 0

    let row_fit = 0
    let col_fit = 0

    for (let y = 0; y < nrows; y++) {
      const row = rows[y]
      if (row.policy == "fixed" || row.policy == "min")
        available_height -= row.height
      else if (row.policy == "fit") {
        available_height -= row.height
        row_fit += 1
      } else if (row.policy == "flex")
        row_flex += row.factor
    }

    for (let x = 0; x < ncols; x++) {
      const col = cols[x]
      if (col.policy == "fixed" || col.policy == "min")
        available_width -= col.width
      else if (col.policy == "fit") {
        available_width -= col.width
        col_fit += 1
      } else if (col.policy == "flex")
        col_flex += col.factor
    }

    available_width -= (ncols - 1)*hspacing
    available_height -= (nrows - 1)*vspacing

    if (available_height > 0) {
      if (row_flex > 0) {
        for (let y = 0; y < nrows; y++) {
          const row = rows[y]
          if (row.policy == "flex")
            row.height = round(available_height * (row.factor/row_flex))
        }
      } else if (row_fit > 0) {
        for (let y = 0; y < nrows; y++) {
          const row = rows[y]
          if (row.policy == "fit")
            row.height += round(available_height/row_fit)
        }
      }
    }

    if (available_width > 0) {
      if (col_flex > 0) {
        for (let x = 0; x < ncols; x++) {
          const col = cols[x]
          if (col.policy == "flex")
            col.width = round(available_width * (col.factor/col_flex))
        }
      } else if (col_fit > 0) {
        for (let x = 0; x < ncols; x++) {
          const col = cols[x]
          if (col.policy == "fit")
            col.width += round(available_width/col_fit)
        }
      }
    }

    for (let y = 0, top = !this.absolute ? 0 : outer.top; y < nrows; y++) {
      const row = rows[y]
      row.top = top
      top += row.height + vspacing
    }

    for (let x = 0, left = !this.absolute ? 0 : outer.left; x < ncols; x++) {
      const col = cols[x]
      col.left = left
      left += col.width + hspacing
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
            width = item.size_hint.width
          else if (sizing.width_policy == "min")
            width = item.size_hint.width
          else if (sizing.width_policy == "max" || sizing.width_policy == "fit") {
            const {left, right} = sizing.margin
            width = item.layout.clip_width(col.width - left - right)
          } else
            throw new Error("unreachable")

          let height: number
          if (sizing.height_policy == "fixed")
            height = item.size_hint.height
          else {
            if (item.layout.has_hfw()) {
              height = item.layout.hfw(width)
            } else if (sizing.height_policy == "min")
              height = item.size_hint.height
            else if (sizing.height_policy == "max" || sizing.height_policy == "fit") {
              const {top, bottom} = sizing.margin
              height = item.layout.clip_height(row.height - top - bottom)
            } else
              throw new Error("unreachable")
          }

          let left = col.left
          if (width == col.width)
            left += sizing.margin.left
          else {
            if (col.align == "start")
              left += sizing.margin.left
            else if (col.align == "center")
              left += round((col.width - width)/2)
            else if (col.align == "end")
              left += col.width - width
          }

          let top = row.top
          if (height == row.height)
            top += sizing.margin.top
          else {
            if (row.align == "start")
              top += sizing.margin.top
            else if (row.align == "center")
              top += round((row.height - height)/2)
            else if (row.align == "end")
              top += row.height - sizing.margin.bottom - height
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
