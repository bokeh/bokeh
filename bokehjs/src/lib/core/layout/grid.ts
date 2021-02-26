import {SizeHint, Size, Sizeable} from "./types"
import {Extents} from "../types"
import {Layoutable} from "./layoutable"
import {Align} from "../enums"
import {isNumber, isString, isPlainObject} from "../util/types"
import {BBox} from "../util/bbox"
import {sum, some} from "../util/array"

const {max, round} = Math

class DefaultMap<K, V> {
  private _map = new Map<K, V>()

  constructor(readonly def: () => V) {}

  get(key: K): V {
    let value = this._map.get(key)
    if (value === undefined) {
      value = this.def()
      this._map.set(key, value)
    }
    return value
  }

  apply(key: K, fn: (val: V) => V): void {
    const value = this.get(key)
    this._map.set(key, fn(value))
  }
}

export type GridItem = {
  layout: Layoutable
  row: number
  col: number
  row_span?: number
  col_span?: number
}

export type ItemSizeHint = {
  layout: Layoutable
  size_hint: SizeHint
}

export type GridSize = {
  size: Size
  row_heights: number[]
  col_widths: number[]
}

export type GridSizeHint = GridSize & {
  size_hints: Container<ItemSizeHint>
}

type TrackAlign = "auto" | Align

type TrackSpec<T> = (({policy: "fixed"} & T) | {policy: "min"} | {policy: "fit" | "max", flex: number}) & {align: TrackAlign}

type RowSpec = TrackSpec<{height: number}>
type ColSpec = TrackSpec<{width: number}>

type GridState = {
  items: Container<Layoutable>
  nrows: number
  ncols: number
  rows: RowSpec[]
  cols: ColSpec[]
  rspacing: number
  cspacing: number
}

export type QuickTrackSizing = "auto" | "min" | "fit" | "max" | number

export type RowSizing =
  {policy: "auto" | "min", align?: TrackAlign} |
  {policy: "fit" | "max", flex?: number, align?: TrackAlign} |
  {policy: "fixed", height: number, align?: TrackAlign}

export type ColSizing =
  {policy: "auto" | "min", align?: TrackAlign} |
  {policy: "fit" | "max", flex?: number, align?: TrackAlign} |
  {policy: "fixed", width: number, align?: TrackAlign}

export type RowsSizing = QuickTrackSizing | {[key: string]: QuickTrackSizing | RowSizing}

export type ColsSizing = QuickTrackSizing | {[key: string]: QuickTrackSizing | ColSizing}

type Span = {r0: number, c0: number, r1: number, c1: number}

class Container<T> {
  private readonly _items: {span: Span, data: T}[] = []

  private _nrows: number = 0
  private _ncols: number = 0

  get nrows(): number {
    return this._nrows
  }
  get ncols(): number {
    return this._ncols
  }

  add(span: Span, data: T): void {
    const {r1, c1} = span
    this._nrows = max(this._nrows, r1 + 1)
    this._ncols = max(this._ncols, c1 + 1)
    this._items.push({span, data})
  }

  at(r: number, c: number): T[] {
    const selected = this._items.filter(({span}) => {
      return span.r0 <= r && r <= span.r1 &&
             span.c0 <= c && c <= span.c1
    })
    return selected.map(({data}) => data)
  }

  row(r: number): T[] {
    const selected = this._items.filter(({span}) => span.r0 <= r && r <= span.r1)
    return selected.map(({data}) => data)
  }

  col(c: number): T[] {
    const selected = this._items.filter(({span}) => span.c0 <= c && c <= span.c1)
    return selected.map(({data}) => data)
  }

  foreach(fn: (span: Span, data: T) => void): void {
    for (const {span, data} of this._items) {
      fn(span, data)
    }
  }

  map<U>(fn: (span: Span, data: T) => U): Container<U> {
    const result = new Container<U>()
    for (const {span, data} of this._items) {
      result.add(span, fn(span, data))
    }
    return result
  }
}

export class Grid extends Layoutable {
  *[Symbol.iterator]() {
    for (const {layout} of this.items) {
      yield layout
    }
  }

  rows: RowsSizing = "auto"
  cols: ColsSizing = "auto"

  spacing: number | [number, number] = 0

  private _state: GridState

  constructor(public items: GridItem[] = []) {
    super()
  }

  is_width_expanding(): boolean {
    if (super.is_width_expanding())
      return true

    if (this.sizing.width_policy == "fixed")
      return false

    const {cols} = this._state
    return some(cols, (col) => col.policy == "max")
  }

  is_height_expanding(): boolean {
    if (super.is_height_expanding())
      return true

    if (this.sizing.height_policy == "fixed")
      return false

    const {rows} = this._state
    return some(rows, (row) => row.policy == "max")
  }

  protected _init(): void {
    super._init()

    const items = new Container<Layoutable>()
    for (const {layout, row, col, row_span, col_span} of this.items) {
      if (layout.sizing.visible) {
        const r0 = row
        const c0 = col
        const r1 = row + (row_span != null ? row_span : 1) - 1
        const c1 = col + (col_span != null ? col_span : 1) - 1
        items.add({r0, c0, r1, c1}, layout)
      }
    }

    const {nrows, ncols} = items

    const rows: RowSpec[] = new Array(nrows)
    for (let y = 0; y < nrows; y++) {
      const row = ((): RowSizing => {
        const sizing = isPlainObject(this.rows) ? this.rows[y] ?? this.rows["*"] : this.rows

        if (sizing == null)
          return {policy: "auto"}
        else if (isNumber(sizing))
          return {policy: "fixed", height: sizing}
        else if (isString(sizing))
          return {policy: sizing} as RowSizing
        else
          return sizing
      })()

      const align = row.align ?? "auto"

      if (row.policy == "fixed")
        rows[y] = {policy: "fixed", height: row.height, align}
      else if (row.policy == "min")
        rows[y] = {policy: "min", align}
      else if (row.policy == "fit" || row.policy == "max")
        rows[y] = {policy: row.policy, flex: row.flex ?? 1, align}
      else if (row.policy == "auto") {
        if (some(items.row(y), (layout) => layout.is_height_expanding()))
          rows[y] = {policy: "max", flex: 1, align}
        else
          rows[y] = {policy: "min", align}
      } else
        throw new Error("unrechable")
    }

    const cols: ColSpec[] = new Array(ncols)
    for (let x = 0; x < ncols; x++) {
      const col = ((): ColSizing => {
        const sizing = isPlainObject(this.cols) ? this.cols[x] ?? this.cols["*"] : this.cols

        if (sizing == null)
          return {policy: "auto"}
        else if (isNumber(sizing))
          return {policy: "fixed", width: sizing}
        else if (isString(sizing))
          return {policy: sizing} as ColSizing
        else
          return sizing
      })()

      const align = col.align ?? "auto"

      if (col.policy == "fixed")
        cols[x] = {policy: "fixed", width: col.width, align}
      else if (col.policy == "min")
        cols[x] = {policy: "min", align}
      else if (col.policy == "fit" || col.policy == "max")
        cols[x] = {policy: col.policy, flex: col.flex ?? 1, align}
      else if (col.policy == "auto") {
        if (some(items.col(x), (layout) => layout.is_width_expanding()))
          cols[x] = {policy: "max", flex: 1, align}
        else
          cols[x] = {policy: "min", align}
      } else
        throw new Error("unrechable")
    }

    const [rspacing, cspacing] =
      isNumber(this.spacing) ? [this.spacing, this.spacing] : this.spacing

    this._state = {items, nrows, ncols, rows, cols, rspacing, cspacing}
  }

  protected _measure_totals(row_heights: number[], col_widths: number[]): Size {
    const {nrows, ncols, rspacing, cspacing} = this._state
    return {
      height: sum(row_heights) + (nrows - 1)*rspacing,
      width: sum(col_widths) + (ncols - 1)*cspacing,
    }
  }

  protected _measure_cells(cell_viewport: (r: number, c: number) => Size): GridSizeHint {
    const {items, nrows, ncols, rows, cols, rspacing, cspacing} = this._state

    const row_heights: number[] = new Array(nrows)
    for (let r = 0; r < nrows; r++) {
      const row = rows[r]
      row_heights[r] = row.policy == "fixed" ? row.height : 0
    }

    const col_widths: number[] = new Array(ncols)
    for (let c = 0; c < ncols; c++) {
      const col = cols[c]
      col_widths[c] = col.policy == "fixed" ? col.width : 0
    }

    const size_hints = new Container<ItemSizeHint>()

    items.foreach((span, layout) => {
      const {r0, c0, r1, c1} = span

      const rspace = (r1 - r0)*rspacing
      const cspace = (c1 - c0)*cspacing

      let height = 0
      for (let r = r0; r <= r1; r++) {
        height += cell_viewport(r, c0).height
      }
      height += rspace

      let width = 0
      for (let c = c0; c <= c1; c++) {
        width += cell_viewport(r0, c).width
      }
      width += cspace

      const size_hint = layout.measure({width, height})
      size_hints.add(span, {layout, size_hint})

      const size = new Sizeable(size_hint).grow_by(layout.sizing.margin)

      size.height -= rspace
      size.width -= cspace

      const radjustable = []
      for (let r = r0; r <= r1; r++) {
        const row = rows[r]
        if (row.policy == "fixed")
          size.height -= row.height
        else
          radjustable.push(r)
      }

      if (size.height > 0) {
        const rheight = round(size.height/radjustable.length)
        for (const r of radjustable) {
          row_heights[r] = max(row_heights[r], rheight)
        }
      }

      const cadjustable = []
      for (let c = c0; c <= c1; c++) {
        const col = cols[c]
        if (col.policy == "fixed")
          size.width -= col.width
        else
          cadjustable.push(c)
      }

      if (size.width > 0) {
        const cwidth = round(size.width/cadjustable.length)
        for (const c of cadjustable) {
          col_widths[c] = max(col_widths[c], cwidth)
        }
      }
    })

    const size = this._measure_totals(row_heights, col_widths)
    return {size, row_heights, col_widths, size_hints}
  }

  protected _measure_grid(viewport: Size): GridSize {
    const {nrows, ncols, rows, cols, rspacing, cspacing} = this._state

    const distribute_height = (size_hint: GridSizeHint) => {
      let available_height: number
      if (this.sizing.height_policy == "fixed" && this.sizing.height != null)
        available_height = this.sizing.height
      else if (viewport.height != Infinity && this.is_height_expanding())
        available_height = viewport.height
      else
        available_height = size_hint.size.height

      let height_flex = 0
      for (let y = 0; y < nrows; y++) {
        const row = rows[y]
        if (row.policy == "fit" || row.policy == "max")
          height_flex += row.flex
        else
          available_height -= size_hint.row_heights[y]
      }

      available_height -= (nrows - 1)*rspacing

      if (height_flex != 0 && available_height > 0) {
        for (let y = 0; y < nrows; y++) {
          const row = rows[y]
          if (row.policy == "fit" || row.policy == "max") {
            const height = round(available_height * (row.flex/height_flex))
            available_height -= height
            size_hint.row_heights[y] = height
            height_flex -= row.flex
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
            const height = size_hint.row_heights[y]
            const cutoff = round(overflow_height/nadjustable)
            size_hint.row_heights[y] = max(height - cutoff, 0)
            overflow_height -= cutoff > height ? height : cutoff
            nadjustable--
          }
        }
      }
    }

    const distribute_width = (size_hint: GridSizeHint) => {
      let available_width: number
      if (this.sizing.width_policy == "fixed" && this.sizing.width != null)
        available_width = this.sizing.width
      else if (viewport.width != Infinity && this.is_width_expanding())
        available_width = viewport.width
      else
        available_width = size_hint.size.width

      let width_flex = 0
      for (let x = 0; x < ncols; x++) {
        const col = cols[x]
        if (col.policy == "fit" || col.policy == "max")
          width_flex += col.flex
        else
          available_width -= size_hint.col_widths[x]
      }

      available_width -= (ncols - 1)*cspacing

      if (width_flex != 0 && available_width > 0) {
        for (let x = 0; x < ncols; x++) {
          const col = cols[x]
          if (col.policy == "fit" || col.policy == "max") {
            const width = round(available_width * (col.flex/width_flex))
            available_width -= width
            size_hint.col_widths[x] = width
            width_flex -= col.flex
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
            const width = size_hint.col_widths[x]
            const cutoff = round(overflow_width/nadjustable)
            size_hint.col_widths[x] = max(width - cutoff, 0)
            overflow_width -= cutoff > width ? width : cutoff
            nadjustable--
          }
        }
      }
    }

    const preferred = this._measure_cells((y, x) => {
      const row = rows[y]
      const col = cols[x]
      return {
        width: col.policy == "fixed" ? col.width : Infinity,
        height: row.policy == "fixed" ? row.height : Infinity,
      }
    })

    distribute_height(preferred)
    distribute_width(preferred)

    const adjusted = this._measure_cells((y, x) => {
      return {
        width: preferred.col_widths[x],
        height: preferred.row_heights[y],
      }
    })

    distribute_height(adjusted)
    distribute_width(adjusted)

    const {row_heights, col_widths} = adjusted
    const size = this._measure_totals(row_heights, col_widths)

    return {size, row_heights, col_widths}
  }

  protected _measure(viewport: Size): SizeHint {
    const {size} = this._measure_grid(viewport)
    return size
  }

  protected _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    const {nrows, ncols, rspacing, cspacing} = this._state

    const {row_heights, col_widths} = this._measure_grid(outer)
    const {size_hints} = this._measure_cells((y, x) => {
      return {
        width: col_widths[x],
        height: row_heights[y],
      }
    })

    const rows = this._state.rows.map((row, r): RowSpec & {top: number, height: number, bottom: number} => {
      return {...row, top: 0, height: row_heights[r], get bottom() { return this.top + this.height }}
    })

    const cols = this._state.cols.map((col, c): ColSpec & {left: number, width: number, right: number} => {
      return {...col, left: 0, width: col_widths[c], get right() { return this.left + this.width }}
    })

    const items = size_hints.map((_, item) => {
      return {...item, outer: new BBox(), inner: new BBox()}
    })

    for (let r = 0, top = !this.absolute ? 0 : outer.top; r < nrows; r++) {
      const row = rows[r]
      row.top = top
      top += row.height + rspacing
    }

    for (let c = 0, left = !this.absolute ? 0 : outer.left; c < ncols; c++) {
      const col = cols[c]
      col.left = left
      left += col.width + cspacing
    }

    function span_width(c0: number, c1: number) {
      let width = (c1 - c0)*cspacing
      for (let c = c0; c <= c1; c++) {
        width += cols[c].width
      }
      return width
    }

    function span_height(r0: number, r1: number) {
      let height = (r1 - r0)*rspacing
      for (let r = r0; r <= r1; r++) {
        height += rows[r].height
      }
      return height
    }

    items.foreach(({r0, c0, r1, c1}, item) => {
      const {layout, size_hint} = item

      const {sizing} = layout
      const {width, height} = size_hint

      const span = {
        width: span_width(c0, c1),
        height: span_height(r0, r1),
      }

      const halign = c0 == c1 && cols[c0].align != "auto" ? cols[c0].align : sizing.halign
      const valign = r0 == r1 && rows[r0].align != "auto" ? rows[r0].align : sizing.valign

      let left = cols[c0].left
      if (halign == "start")
        left += sizing.margin.left
      else if (halign == "center")
        left += round((span.width - width)/2)
      else if (halign == "end")
        left += span.width - sizing.margin.right - width

      let top = rows[r0].top
      if (valign == "start")
        top += sizing.margin.top
      else if (valign == "center")
        top += round((span.height - height)/2)
      else if (valign == "end")
        top += span.height - sizing.margin.bottom - height

      item.outer = new BBox({left, top, width, height})
    })

    type Aligns = {
      start: DefaultMap<number, number>
      end: DefaultMap<number, number>
    }

    const row_aligns = rows.map((): Aligns => {
      return {
        start: new DefaultMap(() => 0),
        end: new DefaultMap(() => 0),
      }
    })
    const col_aligns = cols.map((): Aligns => {
      return {
        start: new DefaultMap(() => 0),
        end: new DefaultMap(() => 0),
      }
    })

    items.foreach(({r0, c0, r1, c1}, {size_hint, outer}) => {
      const {inner} = size_hint

      if (inner != null) {
        row_aligns[r0].start.apply(outer.top, (v) => max(v, inner.top))
        row_aligns[r1].end.apply(rows[r1].bottom - outer.bottom, (v) => max(v, inner.bottom))

        col_aligns[c0].start.apply(outer.left, (v) => max(v, inner.left))
        col_aligns[c1].end.apply(cols[c1].right - outer.right, (v) => max(v, inner.right))
      }
    })

    items.foreach(({r0, c0, r1, c1}, item) => {
      const {size_hint, outer} = item

      const inner_bbox = (extents: Extents) => {
        const outer_bbox = this.absolute ? outer : outer.relative()

        const left = outer_bbox.left + extents.left
        const top = outer_bbox.top + extents.top
        const right = outer_bbox.right - extents.right
        const bottom = outer_bbox.bottom - extents.bottom

        return new BBox({left, top, right, bottom})
      }

      if (size_hint.inner != null) {
        let inner = inner_bbox(size_hint.inner)

        if (size_hint.align !== false) {
          const top = row_aligns[r0].start.get(outer.top)
          const bottom = row_aligns[r1].end.get(rows[r1].bottom - outer.bottom)

          const left = col_aligns[c0].start.get(outer.left)
          const right = col_aligns[c1].end.get(cols[c1].right - outer.right)

          try {
            inner = inner_bbox({top, bottom, left, right})
          } catch {}
        }

        item.inner = inner
      } else
        item.inner = outer
    })

    items.foreach((_, {layout, outer, inner}) => {
      layout.set_geometry(outer, inner)
    })
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
