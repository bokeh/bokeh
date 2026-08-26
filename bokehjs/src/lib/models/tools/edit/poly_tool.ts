import type * as p from "core/properties"
import {isField} from "core/vectorization"
import type {UIEvent} from "core/ui_events"
import {dict, keys} from "core/util/object"
import {isArray} from "core/util/types"
import {assert} from "core/util/assert"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import type {XYGlyph} from "../../glyphs/xy_glyph"
import {ColumnarDataSource} from "../../sources/columnar_data_source"
import {GeometryDataSource} from "../../sources/geometry_data_source"
import type {IndexedDataSource} from "../../sources/indexed_data_source"
import {EditTool, EditToolView} from "./edit_tool"

export type PolyDataSource = ColumnarDataSource | GeometryDataSource

export abstract class PolyToolView extends EditToolView {
  declare model: PolyTool

  _poly_data_source(renderer: GlyphRenderer): PolyDataSource {
    const data_source = renderer.data_source as IndexedDataSource
    if (data_source instanceof ColumnarDataSource || data_source instanceof GeometryDataSource) {
      return data_source
    }
    throw new Error(`${this.model} requires a ColumnarDataSource or GeometryDataSource`)
  }

  _poly_array<T>(source: PolyDataSource, field: string): T[] {
    return source.get_array<T>(field)
  }

  _emit_poly_changes(
    source: PolyDataSource,
    redraw: boolean = true,
    clear: boolean = true,
    emit: boolean = true,
  ): void {
    if (source instanceof ColumnarDataSource) {
      this._emit_cds_changes(source, redraw, clear, emit)
      return
    }
    if (clear) {
      source.selection_manager.clear()
    }
    if (emit) {
      source.commit_coordinates()
    } else if (redraw) {
      source.change.emit()
    }
  }

  _delete_selected_poly(renderer: GlyphRenderer): void {
    const source = this._poly_data_source(renderer)
    if (source instanceof ColumnarDataSource) {
      this._delete_selected(renderer)
    } else {
      source.delete(Array.from(source.selected.indices))
      source.selection_manager.clear()
    }
  }

  _pop_polygons(source: PolyDataSource, num_objects: number): void {
    if (source instanceof ColumnarDataSource) {
      this._pop_glyphs(source, num_objects)
    } else if (num_objects != 0) {
      const drop = source.length-num_objects+1
      if (drop > 0) {
        source.delete(Array.from({length: drop}, (_, i) => i))
      }
    }
  }

  _append_polygon(
    source: PolyDataSource,
    x: number,
    y: number,
    xkey: string | null,
    ykey: string | null,
    placeholder: boolean = true,
  ): void {
    const xs = placeholder ? [x, x] : [x]
    const ys = placeholder ? [y, y] : [y]
    if (source instanceof GeometryDataSource) {
      const attrs: {[key: string]: unknown} = {}
      const overrides = dict(this.model.default_overrides)
      for (const field of keys(source.data)) {
        attrs[field] = overrides.get(field) ?? this.model.empty_value
      }
      source.append_polygon(xs, ys, attrs)
    } else {
      if (xkey != null) {
        source.get_array<number[]>(xkey).push(xs)
      }
      if (ykey != null) {
        source.get_array<number[]>(ykey).push(ys)
      }
      this._pad_empty_columns(source, [xkey, ykey])
    }
  }

  _set_vertices(xs: number[] | number, ys: number[] | number): void {
    const {vertex_renderer} = this.model
    assert(vertex_renderer != null)
    const point_glyph = vertex_renderer.glyph
    const point_cds = this._data_source(vertex_renderer)
    const pxkey = isField(point_glyph.x) ? point_glyph.x.field : null
    const pykey = isField(point_glyph.y) ? point_glyph.y.field : null
    const data = dict(point_cds.data)
    if (pxkey != null) {
      if (isArray(xs)) {
        data.set(pxkey, xs)
      } else {
        point_glyph.x = {value: xs}
      }
    }
    if (pykey != null) {
      if (isArray(ys)) {
        data.set(pykey, ys)
      } else {
        point_glyph.y = {value: ys}
      }
    }
    this._emit_cds_changes(point_cds, true, true, false)
  }

  _hide_vertices(): void {
    this._set_vertices([], [])
  }

  _snap_to_vertex(ev: UIEvent, x: number, y: number): [number, number] {
    if (this.model.vertex_renderer != null) {
      // If an existing vertex is hit snap to it
      const vertex_selected = this._select_event(ev, "replace", [this.model.vertex_renderer])
      const point_ds = this._data_source(this.model.vertex_renderer)
      // Type once dataspecs are typed
      const point_glyph = this.model.vertex_renderer.glyph
      const pxkey = isField(point_glyph.x) ? point_glyph.x.field : null
      const pykey = isField(point_glyph.y) ? point_glyph.y.field : null
      if (vertex_selected.length != 0) {
        const index = point_ds.selected.indices[0]
        const data = dict(point_ds.data)
        if (pxkey != null) {
          x = data.get(pxkey)![index] as number
        }
        if (pykey != null) {
          y = data.get(pykey)![index] as number
        }
        point_ds.selection_manager.clear()
      }
    }
    return [x, y]
  }
}

export namespace PolyTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = EditTool.Props & {
    vertex_renderer: p.Property<GlyphRenderer<XYGlyph> | null>
  }
}

export interface PolyTool extends PolyTool.Attrs {}

export abstract class PolyTool extends EditTool {
  declare properties: PolyTool.Props
  declare __view_type__: PolyToolView

  static {
    this.define<PolyTool.Props>(({Ref, Nullable}) => ({
      vertex_renderer: [ Nullable(Ref(GlyphRenderer<XYGlyph>)), null ],
    }))
  }
}
