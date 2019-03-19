import {SizeHint, Size, Sizeable} from "./types"
import {Layoutable} from "./layoutable"
import {isNumber, isString, isObject} from "../util/types"
import {Set, Matrix} from "core/util/data_structures"
import {BBox} from "../util/bbox"
import {sum} from "../util/array"

const {max, round} = Math

export type TrackAlign = "start" | "center" | "end"

export type GridItem = {
  layout: Layoutable
  row: number
  col: number
  //row_span?: number
  //col_span?: number
}

type GridCellItem = {
  layout: Layoutable
  /*
  size_hint: SizeHint
  outer: BBox
  inner?: BBox
  */
}

class GridCell {
  items: GridCellItem[] = []
}

export type TrackSize = {
  row_heights: number[]
  col_widths: number[]
}

export type GridSizeHint = {size: Size/*, size_hints: Matrix<SizeHint[]>*/} & TrackSize

type TrackSpec<T> = (({policy: "fixed"} & T) | {policy: "min" | "fit"} | {policy: "flex", factor: number}) & {align: TrackAlign}

type RowSpec = TrackSpec<{height: number}>
type ColSpec = TrackSpec<{width: number}>

type GridState = {
  matrix: Matrix<GridCell>
  nrows: number
  ncols: number
  rows: RowSpec[]
  cols: ColSpec[]
  hspacing: number
  vspacing: number
}

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

export type RowsSizing = QuickTrackSizing | {[key: string]: RowSizing}

export type ColsSizing = QuickTrackSizing | {[key: string]: ColSizing}

export class Grid extends Layoutable {

  rows: RowsSizing = "auto"
  cols: ColsSizing = "auto"

  spacing: number | [number, number] = 0

  absolute: boolean = false

  private _state: GridState

  constructor(public items: GridItem[] = []) {
    super()
  }

  is_width_expanding(): boolean {
    if (super.is_width_expanding())
      return true

    if (this.sizing.width_policy != "fixed") {
      const {cols, ncols} = this._state
      for (let x = 0; x < ncols; x++) {
        if (cols[x].policy == "flex")
          return true
      }
    }

    return false
  }

  is_height_expanding(): boolean {
    if (super.is_height_expanding())
      return true

    if (this.sizing.height_policy != "fixed") {
      const {rows, nrows} = this._state
      for (let y = 0; y < nrows; y++) {
        if (rows[y].policy == "flex")
          return true
      }
    }

    return false
  }

  protected _init(): void {
    super._init()

    let nrows = 0
    let ncols = 0

    for (const {row, col} of this.items) {
      nrows = max(nrows, row)
      ncols = max(ncols, col)
    }

    nrows += 1
    ncols += 1

    const matrix = new Matrix<GridCell>(nrows, ncols, () => new GridCell())

    for (const {layout, row, col} of this.items) {
      if (layout.sizing.visible)
        matrix.at(row, col).items.push({layout})
    }

    const rows: RowSpec[] = new Array(nrows)
    for (let y = 0; y < nrows; y++) {
      let row = isObject(this.rows) ? this.rows[y] || this.rows["*"] : this.rows

      if (row == null) {
        row = {policy: "auto"}
      } else if (isNumber(row)) {
        row = {policy: "fixed", height: row}
      } else if (isString(row)) {
        row = {policy: row}
      }

      if (row.policy == "auto" || row.policy == "fit") {
        row_auto: for (let x = 0; x < ncols; x++) {
          const cell = matrix.at(y, x)
          for (let i = 0; i < cell.items.length; i++) {
            const {layout} = cell.items[i]

            if (layout.is_height_expanding()) {
              row = {policy: "max", align: row.align}
              break row_auto
            }
          }
        }
      }

      const align = row.align || "start"

      if (row.policy == "fixed")
        rows[y] = {align, height: row.height, policy: "fixed"}
      else if (row.policy == "fit")
        rows[y] = {align, policy: "fit"}
      else if (row.policy == "min" || row.policy == "auto")
        rows[y] = {align, policy: "min"}
      else if (row.policy == "max")
        rows[y] = {align, policy: "flex", factor: 1}
      else if (row.policy == "flex")
        rows[y] = {align, policy: "flex", factor: row.factor}
      else
        throw new Error("unrechable")
    }

    const cols: ColSpec[] = new Array(ncols)
    for (let x = 0; x < ncols; x++) {
      let col = isObject(this.cols) ? this.cols[x] || this.cols["*"] : this.cols

      if (col == null) {
        col = {policy: "auto"}
      } else if (isNumber(col)) {
        col = {policy: "fixed", width: col}
      } else if (isString(col)) {
        col = {policy: col}
      }

      if (col.policy == "auto" || col.policy == "fit") {
        col_auto: for (let y = 0; y < nrows; y++) {
          const cell = matrix.at(y, x)
          for (let i = 0; i < cell.items.length; i++) {
            const {layout} = cell.items[i]

            if (layout.is_width_expanding()) {
              col = {policy: "max", align: col.align}
              break col_auto
            }
          }
        }
      }

      const align = col.align || "start"

      if (col.policy == "fixed")
        cols[x] = {align, width: col.width, policy: "fixed"}
      else if (col.policy == "fit")
        cols[x] = {align, policy: "fit"}
      else if (col.policy == "min" || col.policy == "auto")
        cols[x] = {align, policy: "min"}
      else if (col.policy == "max")
        cols[x] = {align, policy: "flex", factor: 1}
      else if (col.policy == "flex")
        cols[x] = {align, policy: "flex", factor: col.factor}
      else
        throw new Error("unrechable")
    }

    const [hspacing, vspacing] =
      isNumber(this.spacing) ? [this.spacing, this.spacing] : this.spacing

    this._state = {matrix, nrows, ncols, rows, cols, hspacing, vspacing}
  }

  protected _measure_totals(row_heights: number[], col_widths: number[]): Size {
    const {nrows, ncols, hspacing, vspacing} = this._state
    return {
      height: sum(row_heights) + (nrows - 1)*vspacing,
      width: sum(col_widths) + (ncols - 1)*hspacing,
    }
  }

  protected _measure_cells(cell_viewport: (y: number, x: number) => Size): GridSizeHint {
    const {matrix, nrows, ncols, rows, cols} = this._state

    const cell_sizes = new Matrix(nrows, ncols, () => new Sizeable())
    for (let y = 0; y < nrows; y++) {
      for (let x = 0; x < ncols; x++) {
        const cell = matrix.at(y, x)
        for (const {layout} of cell.items) {
          const size_hint = layout.measure(cell_viewport(y, x))
          cell_sizes.at(y, x).expand_to(new Sizeable(size_hint).grow_by(layout.sizing.margin))
        }
      }
    }

    const row_heights: number[] = new Array(nrows)
    for (let y = 0; y < nrows; y++) {
      const row = rows[y]
      if (row.policy == "fixed")
        row_heights[y] = row.height
      else {
        let height = 0
        for (let x = 0; x < ncols; x++) {
          height = max(height, cell_sizes.at(y, x).height)
        }
        row_heights[y] = height
      }
    }

    const col_widths: number[] = new Array(ncols)
    for (let x = 0; x < ncols; x++) {
      const col = cols[x]
      if (col.policy == "fixed")
        col_widths[x] = col.width
      else {
        let width = 0
        for (let y = 0; y < nrows; y++) {
          width = max(width, cell_sizes.at(y, x).width)
        }
        col_widths[x] = width
      }
    }

    const size = this._measure_totals(row_heights, col_widths)
    return {size, row_heights, col_widths}
  }

  protected _measure_grid(viewport: Size): GridSizeHint {
    const {nrows, ncols, rows, cols, hspacing, vspacing} = this._state

    const preferred = this._measure_cells((y: number, x: number) => {
      const row = rows[y]
      const col = cols[x]
      return {
        width: col.policy == "fixed" ? col.width : Infinity,
        height: row.policy == "fixed" ? row.height : Infinity,
      }
    })

    let available_height: number
    if (this.sizing.height_policy == "fixed" && this.sizing.height != null)
      available_height = this.sizing.height
    else if (viewport.height != Infinity && this.is_height_expanding())
      available_height = viewport.height
    else
      available_height = preferred.size.height

    let height_flex = 0
    for (let y = 0; y < nrows; y++) {
      const row = rows[y]
      if (row.policy != "flex")
        available_height -= preferred.row_heights[y]
      else
        height_flex += row.factor
    }

    available_height -= (nrows - 1)*vspacing

    if (height_flex != 0 && available_height > 0) {
      for (let y = 0; y < nrows; y++) {
        const row = rows[y]
        if (row.policy == "flex") {
          const height = round(available_height * (row.factor/height_flex))
          available_height -= height
          preferred.row_heights[y] = height
          height_flex -= row.factor
        }
      }
    } else if (available_height < 0) {
      let nadjustable = 0
      for (let y = 0; y < nrows; y++) {
        const row = rows[y]
        if (row.policy != "fixed")
          nadjustable++
      }

      let overflow_height = -available_height
      for (let y = 0; y < nrows; y++) {
        const row = rows[y]
        if (row.policy != "fixed") {
          const height = preferred.row_heights[y]
          const cutoff = overflow_height/nadjustable
          preferred.row_heights[y] = max(height - cutoff, 0)
          overflow_height -= cutoff > height ? height : cutoff
          nadjustable--
        }
      }
    }

    let available_width: number
    if (this.sizing.width_policy == "fixed" && this.sizing.width != null)
      available_width = this.sizing.width
    else if (viewport.width != Infinity && this.is_width_expanding())
      available_width = viewport.width
    else
      available_width = preferred.size.width

    let width_flex = 0
    for (let x = 0; x < ncols; x++) {
      const col = cols[x]
      if (col.policy != "flex")
        available_width -= preferred.col_widths[x]
      else
        width_flex += col.factor
    }

    available_width -= (ncols - 1)*hspacing

    if (width_flex != 0 && available_width > 0) {
      for (let x = 0; x < ncols; x++) {
        const col = cols[x]
        if (col.policy == "flex") {
          const width = round(available_width * (col.factor/width_flex))
          available_width -= width
          preferred.col_widths[x] = width
          width_flex -= col.factor
        }
      }
    } else if (available_width < 0) {
      let nadjustable = 0
      for (let x = 0; x < ncols; x++) {
        const col = cols[x]
        if (col.policy != "fixed")
          nadjustable++
      }

      let overflow_width = -available_width
      for (let x = 0; x < ncols; x++) {
        const col = cols[x]
        if (col.policy != "fixed") {
          const width = preferred.col_widths[x]
          const cutoff = overflow_width/nadjustable
          preferred.col_widths[x] = max(width - cutoff, 0)
          overflow_width -= cutoff > width ? width : cutoff
          nadjustable--
        }
      }
    }

    const {row_heights, col_widths} = this._measure_cells((y, x) => {
      return {
        width: preferred.col_widths[x],
        height: preferred.row_heights[y],
      }
    })

    const size = this._measure_totals(row_heights, col_widths)
    return {size, row_heights, col_widths}
  }

  protected _measure(viewport: Size): SizeHint {
    const {size} = this._measure_grid(viewport)
    return size
  }

  protected _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    const {matrix, nrows, ncols, rows, cols, hspacing, vspacing} = this._state

    const {row_heights, col_widths} = this._measure_grid(outer)
    const size_hints = new Matrix<SizeHint[]>(nrows, ncols, () => [])

    for (let y = 0; y < nrows; y++) {
      for (let x = 0; x < ncols; x++) {
        const cell = matrix.at(y, x)
        for (const {layout} of cell.items) {
          const cell_viewport = {width: col_widths[x], height: row_heights[y]}
          size_hints.at(y, x).push(layout.measure(cell_viewport))
        }
      }
    }

    const row_tops: number[] = new Array(nrows)
    const col_lefts: number[] = new Array(ncols)

    for (let y = 0, top = !this.absolute ? 0 : outer.top; y < nrows; y++) {
      row_tops[y] = top
      top += row_heights[y] + vspacing
    }

    for (let x = 0, left = !this.absolute ? 0 : outer.left; x < ncols; x++) {
      col_lefts[x] = left
      left += col_widths[x] + hspacing
    }

    const geometries = new Matrix<{outer: BBox, inner?: BBox}[]>(nrows, ncols, () => [])

    for (let y = 0; y < nrows; y++) {
      const row = rows[y]
      for (let x = 0; x < ncols; x++) {
        const col = cols[x]
        const cell = matrix.at(y, x)
        for (let i = 0; i < cell.items.length; i++) {
          const item = cell.items[i]
          const {sizing} = item.layout
          const {width, height} = size_hints.at(y, x)[i]

          let left = col_lefts[x]
          if (width == col_widths[x])
            left += sizing.margin.left
          else {
            if (col.align == "start")
              left += sizing.margin.left
            else if (col.align == "center")
              left += round((col_widths[x] - width)/2)
            else if (col.align == "end")
              left += col_widths[x] - sizing.margin.right - width
          }

          let top = row_tops[y]
          if (height == row_heights[y])
            top += sizing.margin.top
          else {
            if (row.align == "start")
              top += sizing.margin.top
            else if (row.align == "center")
              top += round((row_heights[y] - height)/2)
            else if (row.align == "end")
              top += row_heights[y] - sizing.margin.bottom - height
          }

          const outer = new BBox({left, top, width, height})
          geometries.at(y, x).push({outer})
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
        const cell = matrix.at(y, x)
        for (let i = 0; i < cell.items.length; i++) {
          const item = cell.items[i]
          const size_hint = size_hints.at(y, x)[i]
          const geometry = geometries.at(y, x)[i]

          if (size_hint.inner != null) {
            if (geometry.outer.width != col_widths[x]) {
              if (col.align == "start") {
                left = max(left, size_hint.inner.left)
                left_items.add(item)
              } else if (col.align == "end") {
                right = max(right, size_hint.inner.right)
                right_items.add(item)
              }
            } else {
              left = max(left, size_hint.inner.left)
              right = max(right, size_hint.inner.right)
              left_items.add(item)
              right_items.add(item)
            }
          }
        }
      }

      for (let y = 0; y < nrows; y++) {
        const cell = matrix.at(y, x)
        for (let i = 0; i < cell.items.length; i++) {
          const item = cell.items[i]
          const size_hint = size_hints.at(y, x)[i]
          const geometry = geometries.at(y, x)[i]

          if (size_hint.inner != null) {
            const inner_left = size_hint.align !== false && left_items.has(item) ? left : size_hint.inner.left
            const inner_right = size_hint.align !== false && right_items.has(item) ? right : size_hint.inner.right

            geometry.inner = new BBox({
              left: inner_left,
              top: 0,
              right: geometry.outer.width - inner_right,
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
        const cell = matrix.at(y, x)
        for (let i = 0; i < cell.items.length; i++) {
          const item = cell.items[i]
          const size_hint = size_hints.at(y, x)[i]
          const geometry = geometries.at(y, x)[i]

          if (size_hint.inner != null) {
            if (geometry.outer.height != row_heights[y]) {
              if (row.align == "start") {
                top = max(top, size_hint.inner.top)
                top_items.add(item)
              } else if (row.align == "end") {
                bottom = max(bottom, size_hint.inner.bottom)
                bottom_items.add(item)
              }
            } else {
              top = max(top, size_hint.inner.top)
              bottom = max(bottom, size_hint.inner.bottom)
              top_items.add(item)
              bottom_items.add(item)
            }
          }
        }
      }

      for (let x = 0; x < ncols; x++) {
        const cell = matrix.at(y, x)
        for (let i = 0; i < cell.items.length; i++) {
          const item = cell.items[i]
          const size_hint = size_hints.at(y, x)[i]
          const geometry = geometries.at(y, x)[i]

          if (size_hint.inner != null) {
            const inner_top = size_hint.align !== false && top_items.has(item) ? top : size_hint.inner.top
            const inner_bottom = size_hint.align !== false && bottom_items.has(item) ? bottom : size_hint.inner.bottom

            geometry.inner = new BBox({
              left: geometry.inner!.left,
              top: inner_top,
              right: geometry.inner!.right,
              bottom: geometry.outer.height - inner_bottom,
            })
          }
        }
      }
    }

    for (let y = 0; y < nrows; y++) {
      for (let x = 0; x < ncols; x++) {
        const cell = matrix.at(y, x)
        for (let i = 0; i < cell.items.length; i++) {
          const item = cell.items[i]
          const geometry = geometries.at(y, x)[i]
          item.layout.set_geometry(geometry.outer, geometry.inner)
        }
      }
    }
  }
}

export class Row extends Grid {
  constructor(items: Layoutable[]) {
    super()
    this.items = items.map((item, i) => ({layout: item, row: 0, col: i}))
    this.rows = "fit"
  }
}

export class Column extends Grid {
  constructor(items: Layoutable[]) {
    super()
    this.items = items.map((item, i) => ({layout: item, row: i, col: 0}))
    this.cols = "fit"
  }
}
