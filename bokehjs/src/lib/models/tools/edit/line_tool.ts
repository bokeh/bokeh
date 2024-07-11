import type * as p from "core/properties"
import {isField} from "core/vectorization"
import {dict} from "core/util/object"
import {isArray} from "core/util/types"
import type {Line} from "../../glyphs/line"
import {GlyphRenderer} from "../../renderers/glyph_renderer"

import {EditTool, EditToolView} from "./edit_tool"

export abstract class LineToolView extends EditToolView {
  declare model: LineTool

  _set_intersection(x: number[] | number, y: number[] | number): void {
    const point_glyph = this.model.intersection_renderer.glyph
    const point_cds = this.model.intersection_renderer.data_source
    const data = dict(point_cds.data)
    const pxkey = isField(point_glyph.x) ? point_glyph.x.field : null
    const pykey = isField(point_glyph.y) ? point_glyph.y.field : null
    if (pxkey != null) {
      if (isArray(x)) {
        data.set(pxkey, x)
      } else {
        point_glyph.x = {value: x}
      }
    }
    if (pykey != null) {
      if (isArray(y)) {
        data.set(pykey, y)
      } else {
        point_glyph.y = {value: y}
      }
    }
    this._emit_cds_changes(point_cds, true, true, false)
  }

  _hide_intersections(): void {
    this._set_intersection([], [])
  }
}

export namespace LineTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = EditTool.Props & {
    intersection_renderer: p.Property<GlyphRenderer<Line>>
  }
}

export interface LineTool extends LineTool.Attrs { }

export abstract class LineTool extends EditTool {
  declare properties: LineTool.Props
  declare __view_type__: LineToolView

  constructor(attrs?: Partial<LineTool.Attrs>) {
    super(attrs)
  }

  static {
    this.define<LineTool.Props>(({Ref}) => ({
      intersection_renderer: [ Ref(GlyphRenderer<Line>) ],
    }))
  }
}
