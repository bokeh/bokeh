import * as p from "core/properties"
import {isArray} from "core/util/types"
import {Line} from "../../glyphs/line"
import {GlyphRenderer} from "../../renderers/glyph_renderer"

import {EditTool, EditToolView} from "./edit_tool"

export type HasLineGlyph = {
  glyph: Line
}

export abstract class LineToolView extends EditToolView {
  override model: LineTool

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
    renderers: p.Property<(GlyphRenderer & HasLineGlyph)[]>
    intersection_renderer: p.Property<(GlyphRenderer & HasLineGlyph)>
  }
}

export interface LineTool extends LineTool.Attrs { }

export abstract class LineTool extends EditTool {
  override properties: LineTool.Props
  override __view_type__: LineToolView

  renderers: (GlyphRenderer & HasLineGlyph)[]

  constructor(attrs?: Partial<LineTool.Attrs>) {
    super(attrs)
  }

  static init_LineTool(): void {
    this.define<LineTool.Props>(({AnyRef}) => ({
      intersection_renderer: [ AnyRef<GlyphRenderer & HasLineGlyph>() ],
    }))
  }
}
