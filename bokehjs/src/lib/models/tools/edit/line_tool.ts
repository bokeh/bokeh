import type * as p from "core/properties"
import {isArray} from "core/util/types"
import type {Line} from "../../glyphs/line"
import type {GlyphRenderer} from "../../renderers/glyph_renderer"

import {EditTool, EditToolView} from "./edit_tool"

export type HasLineGlyph = {
  glyph: Line
}

export abstract class LineToolView extends EditToolView {
  declare model: LineTool

  _set_intersection(x: number[] | number, y: number[] | number): void {
    const point_glyph: any = this.model.intersection_renderer.glyph
    const point_cds = this.model.intersection_renderer.data_source
    const [pxkey, pykey] = [point_glyph.x.field, point_glyph.y.field]
    if (pxkey) {
      if (isArray(x))
        point_cds.data[pxkey] = x
      else
        point_glyph.x = {value: x}
    }
    if (pykey) {
      if (isArray(y))
        point_cds.data[pykey] = y
      else
        point_glyph.y = {value: y}
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
    intersection_renderer: p.Property<(GlyphRenderer & HasLineGlyph)>
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
    this.define<LineTool.Props>(({AnyRef}) => ({
      intersection_renderer: [ AnyRef<GlyphRenderer & HasLineGlyph>() ],
    }))
  }
}
