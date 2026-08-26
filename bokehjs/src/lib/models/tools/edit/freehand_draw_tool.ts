import type {UIEvent, PanEvent, TapEvent, KeyEvent} from "core/ui_events"
import type * as p from "core/properties"
import {isField} from "core/vectorization"
import {isArray} from "core/util/types"
import type {XsYsGlyph} from "./common"
import {PolyTool, PolyToolView} from "./poly_tool"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {tool_icon_freehand_draw} from "styles/icons.css"

export class FreehandDrawToolView extends PolyToolView {
  declare model: FreehandDrawTool

  _draw(ev: UIEvent, mode: string, emit: boolean = false): void {
    if (!this.model.active) {
      return
    }

    const renderer = this.model.renderers[0]
    const point = this._map_drag(ev.sx, ev.sy, renderer)
    if (point == null) {
      return
    }

    const [x, y] = point
    const {glyph} = renderer
    const data_source = this._poly_data_source(renderer)
    const xkey = isField(glyph.xs) ? glyph.xs.field : null
    const ykey = isField(glyph.ys) ? glyph.ys.field : null
    if (mode == "new") {
      this._pop_polygons(data_source, this.model.num_objects)
      this._append_polygon(data_source, x, y, xkey, ykey, false)
    } else if (mode == "add") {
      if (xkey != null) {
        const column = this._poly_array<number[]>(data_source, xkey)
        const xidx = column.length-1
        let xs = column[xidx]
        if (!isArray(xs)) {
          xs = Array.from(xs)
          column[xidx] = xs
        }
        xs.push(x)
      }
      if (ykey != null) {
        const column = this._poly_array<number[]>(data_source, ykey)
        const yidx = column.length-1
        let ys = column[yidx]
        if (!isArray(ys)) {
          ys = Array.from(ys)
          column[yidx] = ys
        }
        ys.push(y)
      }
    }
    this._emit_poly_changes(data_source, true, true, emit)
  }

  override _pan_start(ev: PanEvent): void {
    this._draw(ev, "new")
  }

  override _pan(ev: PanEvent): void {
    this._draw(ev, "add")
  }

  override _pan_end(ev: PanEvent): void {
    this._draw(ev, "add", true)
  }

  override _tap(ev: TapEvent): void {
    this._select_event(ev, this._select_mode(ev), this.model.renderers)
  }

  override _keyup(ev: KeyEvent): void {
    if (!this.model.active || !this._mouse_in_frame) {
      return
    }
    for (const renderer of this.model.renderers) {
      if (ev.key == "Escape") {
        this._poly_data_source(renderer).selection_manager.clear()
      } else if (ev.key == "Backspace") {
        this._delete_selected_poly(renderer)
      }
    }
  }
}

export namespace FreehandDrawTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = PolyTool.Props & {
    num_objects: p.Property<number>
    renderers: p.Property<GlyphRenderer<XsYsGlyph>[]>
  }
}

export interface FreehandDrawTool extends FreehandDrawTool.Attrs {}

export class FreehandDrawTool extends PolyTool {
  declare properties: FreehandDrawTool.Props
  declare __view_type__: FreehandDrawToolView

  static {
    this.prototype.default_view = FreehandDrawToolView

    this.define<FreehandDrawTool.Props>(({Int, List, Ref}) => ({
      num_objects: [ Int, 0 ],
      renderers:   [ List(Ref(GlyphRenderer<XsYsGlyph>)), [] ],
    }))

  }

  override tool_name = "Freehand Draw Tool"
  override tool_icon = tool_icon_freehand_draw
  override event_type = ["pan" as "pan", "tap" as "tap"]
  override default_order = 3
}
