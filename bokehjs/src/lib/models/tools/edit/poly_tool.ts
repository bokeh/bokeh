import type * as p from "core/properties"
import {isField} from "core/vectorization"
import type {UIEvent} from "core/ui_events"
import {dict} from "core/util/object"
import {isArray} from "core/util/types"
import {assert} from "core/util/assert"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import type {XYGlyph} from "../../glyphs/xy_glyph"
import {EditTool, EditToolView} from "./edit_tool"

export abstract class PolyToolView extends EditToolView {
  declare model: PolyTool

  _set_vertices(xs: number[] | number, ys: number[] | number): void {
    const {vertex_renderer} = this.model
    assert(vertex_renderer != null)
    const point_glyph = vertex_renderer.glyph
    const point_cds = vertex_renderer.data_source
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
      const point_ds = this.model.vertex_renderer.data_source
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

  constructor(attrs?: Partial<PolyTool.Attrs>) {
    super(attrs)
  }

  static {
    this.define<PolyTool.Props>(({Ref, Nullable}) => ({
      vertex_renderer: [ Nullable(Ref(GlyphRenderer<XYGlyph>)), null ],
    }))
  }
}
