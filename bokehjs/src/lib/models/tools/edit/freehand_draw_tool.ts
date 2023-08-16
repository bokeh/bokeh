import type {UIEvent, PanEvent, TapEvent, KeyEvent} from "core/ui_events"
import type * as p from "core/properties"
import {isArray} from "core/util/types"
import type {HasXYGlyph} from "./edit_tool"
import {EditTool, EditToolView} from "./edit_tool"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {tool_icon_freehand_draw} from "styles/icons.css"

export class FreehandDrawToolView extends EditToolView {
  declare model: FreehandDrawTool

  _draw(ev: UIEvent, mode: string, emit: boolean = false): void {
    if (!this.model.active)
      return

    const renderer = this.model.renderers[0]
    const point = this._map_drag(ev.sx, ev.sy, renderer)
    if (point == null)
      return

    const [x, y] = point
    const cds = renderer.data_source
    const glyph: any = renderer.glyph
    const [xkey, ykey] = [glyph.xs.field, glyph.ys.field]
    if (mode == "new") {
      this._pop_glyphs(cds, this.model.num_objects)
      if (xkey) cds.get_array(xkey).push([x])
      if (ykey) cds.get_array(ykey).push([y])
      this._pad_empty_columns(cds, [xkey, ykey])
    } else if (mode == "add") {
      if (xkey) {
        const xidx = cds.data[xkey].length-1
        let xs = cds.get_array<number[]>(xkey)[xidx]
        if (!isArray(xs)) {
          xs = Array.from(xs)
          cds.data[xkey][xidx] = xs
        }
        xs.push(x)
      }
      if (ykey) {
        const yidx = cds.data[ykey].length-1
        let ys = cds.get_array<number[]>(ykey)[yidx]
        if (!isArray(ys)) {
          ys = Array.from(ys)
          cds.data[ykey][yidx] = ys
        }
        ys.push(y)
      }
    }
    this._emit_cds_changes(cds, true, true, emit)
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
    if (!this.model.active || !this._mouse_in_frame)
      return
    for (const renderer of this.model.renderers) {
      if (ev.key == "Escape") {
        renderer.data_source.selection_manager.clear()
      } else if (ev.key == "Backspace") {
        this._delete_selected(renderer)
      }
    }
  }
}

export namespace FreehandDrawTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = EditTool.Props & {
    num_objects: p.Property<number>
    renderers: p.Property<(GlyphRenderer & HasXYGlyph)[]>
  }
}

export interface FreehandDrawTool extends FreehandDrawTool.Attrs {}

export class FreehandDrawTool extends EditTool {
  declare properties: FreehandDrawTool.Props
  declare __view_type__: FreehandDrawToolView

  constructor(attrs?: Partial<FreehandDrawTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = FreehandDrawToolView

    this.define<FreehandDrawTool.Props>(({Int, Array, Ref}) => ({
      num_objects: [ Int, 0 ],
      renderers:   [ Array(Ref<GlyphRenderer & HasXYGlyph>(GlyphRenderer as any)), [] ],
    }))

    this.register_alias("freehand_draw", () => new FreehandDrawTool())
  }

  override tool_name = "Freehand Draw Tool"
  override tool_icon = tool_icon_freehand_draw
  override event_type = ["pan" as "pan", "tap" as "tap"]
  override default_order = 3
}
