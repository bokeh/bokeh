import type * as p from "core/properties"
import type {PointGeometry} from "core/geometry"
import type {UIEvent, MoveEvent} from "core/ui_events"
import type {Dimensions, SelectionMode} from "core/enums"
import {isField} from "core/vectorization"
import {includes} from "core/util/array"
import {isArray} from "core/util/types"
import {unreachable} from "core/util/assert"
import type {XYGlyph} from "../../glyphs/xy_glyph"
import type {ColumnarDataSource} from "../../sources/columnar_data_source"
import type {GlyphRenderer} from "../../renderers/glyph_renderer"
import {GestureTool, GestureToolView} from "../gestures/gesture_tool"

export type HasXYGlyph = {
  glyph: XYGlyph
}

export abstract class EditToolView extends GestureToolView {
  declare model: EditTool

  _basepoint: [number, number] | null
  _mouse_in_frame: boolean = true

  protected _select_mode(ev: UIEvent): SelectionMode {
    const {shift, ctrl} = ev.modifiers

    if (!shift && !ctrl)
      return "replace"
    else if (shift && !ctrl)
      return "append"
    else if (!shift && ctrl)
      return "intersect"
    else if (shift && ctrl)
      return "subtract"
    else
      unreachable()
  }

  override _move_enter(_e: MoveEvent): void {
    this._mouse_in_frame = true
  }

  override _move_exit(_e: MoveEvent): void {
    this._mouse_in_frame = false
  }

  _map_drag(sx: number, sy: number, renderer: GlyphRenderer): [number, number] | null {
    // Maps screen to data coordinates
    const frame = this.plot_view.frame
    if (!frame.bbox.contains(sx, sy)) {
      return null
    }

    const renderer_view = this.plot_view.renderer_view(renderer)
    if (renderer_view == null)
      return null

    const x = renderer_view.coordinates.x_scale.invert(sx)
    const y = renderer_view.coordinates.y_scale.invert(sy)
    return [x, y]
  }

  _delete_selected(renderer: GlyphRenderer): void {
    // Deletes all selected rows in the ColumnDataSource
    const cds = renderer.data_source
    const indices = cds.selected.indices
    indices.sort()
    for (const column of cds.columns()) {
      const values = cds.get_array(column)
      for (let index = 0; index < indices.length; index++) {
        const ind = indices[index]
        values.splice(ind-index, 1)
      }
    }
    this._emit_cds_changes(cds)
  }

  _pop_glyphs(cds: ColumnarDataSource, num_objects: number): void {
    // Pops rows in the CDS until only num_objects are left
    const columns = cds.columns()
    if (num_objects == 0 || columns.length == 0)
      return
    for (const column of columns) {
      let array = cds.get_array(column)
      const drop = array.length-num_objects+1
      if (drop < 1)
        continue
      if (!isArray(array)) {
        array = Array.from(array)
        cds.data[column] = array
      }
      array.splice(0, drop)
    }
  }

  _emit_cds_changes(cds: ColumnarDataSource, redraw: boolean = true, clear: boolean = true, emit: boolean = true): void {
    if (clear)
      cds.selection_manager.clear()
    if (redraw)
      cds.change.emit()
    if (emit) {
      const {data} = cds
      cds.setv({data}, {check_eq: false})
    }
  }

  _drag_points(ev: UIEvent, renderers: (GlyphRenderer & HasXYGlyph)[], dim: Dimensions = "both"): void {
    const {sx, sy} = ev
    for (const renderer of renderers) {
      const point = this._map_drag(sx, sy, renderer)
      if (point == null)
        continue
      const [x, y] = point
      const glyph = renderer.glyph
      const cds = renderer.data_source
      const x_array = isField(glyph.x) ? cds.data[glyph.x.field] : null
      const y_array = isField(glyph.y) ? cds.data[glyph.y.field] : null
      for (const index of cds.selected.indices) {
        if (x_array != null && (dim == "width" || dim == "both")) {
          x_array[index] = x
        }
        if (y_array != null && (dim == "height" || dim == "both")) {
          y_array[index] = y
        }
      }
      cds.change.emit()
    }
    this._basepoint = [sx, sy]
  }

  _pad_empty_columns(cds: ColumnarDataSource, coord_columns: string[]): void {
    // Pad ColumnDataSource non-coordinate columns with empty_value
    for (const column of cds.columns()) {
      if (!includes(coord_columns, column))
        cds.get_array(column).push(this.model.empty_value)
    }
  }

  _select_event(ev: UIEvent, mode: SelectionMode, renderers: GlyphRenderer[]): GlyphRenderer[] {
    // Process selection event on the supplied renderers and return selected renderers
    const frame = this.plot_view.frame
    const {sx, sy} = ev
    if (!frame.bbox.contains(sx, sy)) {
      return []
    }
    const geometry: PointGeometry = {type: "point", sx, sy}
    const selected = []
    for (const renderer of renderers) {
      const sm = renderer.get_selection_manager()
      const cds = renderer.data_source
      const view = this.plot_view.renderer_view(renderer)
      if (view != null) {
        const did_hit = sm.select([view], geometry, true, mode)
        if (did_hit) {
          selected.push(renderer)
        }
        cds.properties.selected.change.emit()
      }
    }
    return selected
  }
}

export namespace EditTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GestureTool.Props & {
    empty_value: p.Property<unknown>
  }
}

export interface EditTool extends EditTool.Attrs {}

export abstract class EditTool extends GestureTool {
  declare properties: EditTool.Props
  declare __view_type__: EditToolView

  constructor(attrs?: Partial<EditTool.Attrs>) {
    super(attrs)
  }

  static {
    this.define<EditTool.Props>(({Unknown}) => ({
      empty_value: [ Unknown, 0 ],
    }))
  }
}
