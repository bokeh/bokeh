import * as p from "core/properties"
import {PointGeometry} from "core/geometry"
import {UIEvent, MoveEvent} from "core/ui_events"
import {Dimensions, SelectionMode} from "core/enums"
import {includes} from "core/util/array"
import {isArray} from "core/util/types"
import {unreachable} from "core/util/assert"
import {XYGlyph} from "../../glyphs/xy_glyph"
import {ColumnarDataSource} from "../../sources/columnar_data_source"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {GestureTool, GestureToolView} from "../gestures/gesture_tool"

export interface HasXYGlyph {
  glyph: XYGlyph
}

export abstract class EditToolView extends GestureToolView {
  model: EditTool

  _basepoint: [number, number] | null
  _mouse_in_frame: boolean = true

  protected _select_mode(ev: UIEvent): SelectionMode {
    const {shiftKey, ctrlKey} = ev

    if (!shiftKey && !ctrlKey)
      return "replace"
    else if (shiftKey && !ctrlKey)
      return "append"
    else if (!shiftKey && ctrlKey)
      return "intersect"
    else if (shiftKey && ctrlKey)
      return "subtract"
    else
      unreachable()
  }

  _move_enter(_e: MoveEvent): void {
    this._mouse_in_frame = true
  }

  _move_exit(_e: MoveEvent): void {
    this._mouse_in_frame = false
  }

  _map_drag(sx: number, sy: number, renderer: GlyphRenderer): [number, number] | null {
    // Maps screen to data coordinates
    const frame = this.plot_view.frame
    if (!frame.bbox.contains(sx, sy)) {
      return null
    }
    const renderer_view = this.plot_view.renderer_views.get(renderer)!
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
    if (!num_objects || !columns.length)
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
      cds.data = cds.data
      cds.properties.data.change.emit()
    }
  }

  _drag_points(ev: UIEvent, renderers: (GlyphRenderer & HasXYGlyph)[], dim: Dimensions = "both"): void {
    if (this._basepoint == null)
      return
    const [bx, by] = this._basepoint
    for (const renderer of renderers) {
      const basepoint = this._map_drag(bx, by, renderer)
      const point = this._map_drag(ev.sx, ev.sy, renderer)
      if (point == null || basepoint == null) {
        continue
      }
      const [x, y] = point
      const [px, py] = basepoint
      const [dx, dy] = [x-px, y-py]
      // Type once dataspecs are typed
      const glyph: any = renderer.glyph
      const cds = renderer.data_source
      const [xkey, ykey] = [glyph.x.field, glyph.y.field]
      for (const index of cds.selected.indices) {
        if (xkey && (dim == "width" || dim == "both")) {
          cds.data[xkey][index] += dx
        }
        if (ykey && (dim == "height" || dim == "both")) {
          cds.data[ykey][index] += dy
        }
      }
      cds.change.emit()
    }
    this._basepoint = [ev.sx, ev.sy]
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
    const geometry: PointGeometry = {type: 'point', sx, sy}
    const selected = []
    for (const renderer of renderers) {
      const sm = renderer.get_selection_manager()
      const cds = renderer.data_source
      const views = [this.plot_view.renderer_views.get(renderer)!]
      const did_hit = sm.select(views, geometry, true, mode)
      if (did_hit) {
        selected.push(renderer)
      }
      cds.properties.selected.change.emit()
    }
    return selected
  }
}

export namespace EditTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GestureTool.Props & {
    custom_icon: p.Property<string>
    custom_tooltip: p.Property<string>
    empty_value: p.Property<any>
    renderers: p.Property<GlyphRenderer[]>
  }
}

export interface EditTool extends EditTool.Attrs {}

export abstract class EditTool extends GestureTool {
  properties: EditTool.Props
  __view_type__: EditToolView

  constructor(attrs?: Partial<EditTool.Attrs>) {
    super(attrs)
  }

  static init_EditTool(): void {
    this.define<EditTool.Props>({
      custom_icon:    [ p.String    ],
      custom_tooltip: [ p.String    ],
      empty_value:    [ p.Any       ],
      renderers:      [ p.Array, [] ],
    })
  }

  get tooltip(): string {
    return this.custom_tooltip || this.tool_name
  }

  get computed_icon(): string {
    return this.custom_icon || this.icon
  }
}
