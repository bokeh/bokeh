import * as p from "core/properties"
import {UIEvent} from "core/ui_events"
import {isArray} from "core/util/types"
import {MultiLine} from "../../glyphs/multi_line"
import {Patches} from "../../glyphs/patches"
import {GlyphRenderer} from "../../renderers/glyph_renderer"

import {EditTool, EditToolView, HasXYGlyph} from "./edit_tool"

export interface HasPolyGlyph {
  glyph: MultiLine | Patches
}

export class PolyToolView extends EditToolView {
  model: PolyTool

  _set_vertices(xs: number[] | number, ys: number[] | number): void {
    const point_glyph: any = this.model.vertex_renderer.glyph;
    const point_cds = this.model.vertex_renderer.data_source;
    const [pxkey, pykey] = [point_glyph.x.field, point_glyph.y.field];
    if (pxkey) {
      if (isArray(xs))
        point_cds.data[pxkey] = xs
      else
        point_glyph.x = {value: xs}
    }
    if (pykey) {
      if (isArray(ys))
        point_cds.data[pykey] = ys
      else
        point_glyph.y = {value: ys}
    }
    this._emit_cds_changes(point_cds, true, true, false)
  }

  _hide_vertices(): void {
    this._set_vertices([], [])
  }

  _snap_to_vertex(ev: UIEvent, x: number, y: number): [number, number] {
    if (this.model.vertex_renderer) {
      // If an existing vertex is hit snap to it
      const vertex_selected = this._select_event(ev, false, [this.model.vertex_renderer]);
      const point_ds = this.model.vertex_renderer.data_source;
      // Type once dataspecs are typed
      const point_glyph: any = this.model.vertex_renderer.glyph;
      const [pxkey, pykey] = [point_glyph.x.field, point_glyph.y.field];
      if (vertex_selected.length) {
        const index = point_ds.selected.indices[0];
        if (pxkey)
          x = point_ds.data[pxkey][index]
        if (pykey)
          y = point_ds.data[pykey][index]
        point_ds.selection_manager.clear()
      }
    }
    return [x, y]
  }
}


export namespace PolyTool {
  export interface Attrs extends EditTool.Attrs {
    renderers: (GlyphRenderer & HasPolyGlyph)[]
    vertex_renderer: (GlyphRenderer & HasXYGlyph)
  }

  export interface Props extends EditTool.Props {}

}

export interface PolyTool extends PolyTool.Attrs {}

export class PolyTool extends EditTool {

  properties: PolyTool.Props

  renderers: (GlyphRenderer & HasPolyGlyph)[]

  constructor(attrs?: Partial<PolyTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "PolyTool"
    this.prototype.default_view = PolyToolView

    this.define({
      vertex_renderer: [ p.Instance ],
    })
  }
}
PolyTool.initClass()
