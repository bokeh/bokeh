import type * as p from "core/properties"
import type {UIEvent} from "core/ui_events"
import {dict} from "core/util/object"
import {isArray} from "core/util/types"
import {assert} from "core/util/assert"
import type {MultiLine} from "../../glyphs/multi_line"
import type {Patches} from "../../glyphs/patches"
import type {GlyphRenderer} from "../../renderers/glyph_renderer"

import type {HasXYGlyph} from "./edit_tool"
import {EditTool, EditToolView} from "./edit_tool"

export interface HasPolyGlyph {
  glyph: MultiLine | Patches
}

export abstract class PolyToolView extends EditToolView {
  declare model: PolyTool

  _set_vertices(xs: number[] | number, ys: number[] | number): void {
    const {vertex_renderer} = this.model
    assert(vertex_renderer != null)
    const point_glyph: any = vertex_renderer.glyph
    const point_cds = vertex_renderer.data_source
    const [pxkey, pykey] = [point_glyph.x.field, point_glyph.y.field]
    const data = dict(point_cds.data)
    if (pxkey) {
      if (isArray(xs))
        data.set(pxkey, xs)
      else
        point_glyph.x = {value: xs}
    }
    if (pykey) {
      if (isArray(ys))
        data.set(pykey, ys)
      else
        point_glyph.y = {value: ys}
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
      const point_glyph: any = this.model.vertex_renderer.glyph
      const [pxkey, pykey] = [point_glyph.x.field, point_glyph.y.field]
      if (vertex_selected.length != 0) {
        const index = point_ds.selected.indices[0]
        const data = dict(point_ds.data)
        if (pxkey)
          x = data.get(pxkey)![index] as number
        if (pykey)
          y = data.get(pykey)![index] as number
        point_ds.selection_manager.clear()
      }
    }
    return [x, y]
  }
}

export namespace PolyTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = EditTool.Props & {
    vertex_renderer: p.Property<(GlyphRenderer & HasXYGlyph) | null>
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
    this.define<PolyTool.Props>(({AnyRef, Nullable}) => ({
      vertex_renderer: [ Nullable(AnyRef<GlyphRenderer & HasXYGlyph>()), null ],
    }))
  }
}
