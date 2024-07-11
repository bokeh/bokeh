import type {PanEvent, TapEvent, KeyEvent} from "core/ui_events"
import type * as p from "core/properties"
import {isField} from "core/vectorization"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import type {XYGlyph} from "../../glyphs/xy_glyph"
import {EditTool, EditToolView} from "./edit_tool"
import {tool_icon_point_draw} from "styles/icons.css"

export class PointDrawToolView extends EditToolView {
  declare model: PointDrawTool

  override _tap(ev: TapEvent): void {
    const renderers = this._select_event(ev, this._select_mode(ev), this.model.renderers)
    if (renderers.length != 0 || !this.model.add) {
      return
    }

    const renderer = this.model.renderers[0]
    const point = this._map_drag(ev.sx, ev.sy, renderer)
    if (point == null) {
      return
    }

    const {glyph, data_source} = renderer
    const xkey = isField(glyph.x) ? glyph.x.field : null
    const ykey = isField(glyph.y) ? glyph.y.field : null
    const [x, y] = point

    this._pop_glyphs(data_source, this.model.num_objects)
    if (xkey != null) {
      data_source.get_array(xkey).push(x)
    }
    if (ykey != null) {
      data_source.get_array(ykey).push(y)
    }
    this._pad_empty_columns(data_source, [xkey, ykey])

    const {data} = data_source
    data_source.setv({data}, {check_eq: false}) // XXX: inplace updates
  }

  override _keyup(ev: KeyEvent): void {
    if (!this.model.active || !this._mouse_in_frame) {
      return
    }
    for (const renderer of this.model.renderers) {
      if (ev.key == "Backspace") {
        this._delete_selected(renderer)
      } else if (ev.key == "Escape") {
        renderer.data_source.selection_manager.clear()
      }
    }
  }

  override _pan_start(ev: PanEvent): void {
    if (!this.model.drag) {
      return
    }
    this._select_event(ev, "append", this.model.renderers)
    this._basepoint = [ev.sx, ev.sy]
  }

  override _pan(ev: PanEvent): void {
    if (!this.model.drag || this._basepoint == null) {
      return
    }
    this._drag_points(ev, this.model.renderers)
  }

  override _pan_end(ev: PanEvent): void {
    if (!this.model.drag) {
      return
    }
    this._pan(ev)
    for (const renderer of this.model.renderers) {
      this._emit_cds_changes(renderer.data_source, false, true, true)
    }
    this._basepoint = null
  }
}

export namespace PointDrawTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = EditTool.Props & {
    add: p.Property<boolean>
    drag: p.Property<boolean>
    num_objects: p.Property<number>
    renderers: p.Property<GlyphRenderer<XYGlyph>[]>
  }
}

export interface PointDrawTool extends PointDrawTool.Attrs {}

export class PointDrawTool extends EditTool {
  declare properties: PointDrawTool.Props
  declare __view_type__: PointDrawToolView

  constructor(attrs?: Partial<PointDrawTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PointDrawToolView

    this.define<PointDrawTool.Props>(({Bool, Int, List, Ref}) => ({
      add:         [ Bool, true ],
      drag:        [ Bool, true ],
      num_objects: [ Int, 0 ],
      renderers:   [ List(Ref(GlyphRenderer<XYGlyph>)), [] ],
    }))
  }

  override tool_name = "Point Draw Tool"
  override tool_icon = tool_icon_point_draw
  override event_type = ["tap" as "tap", "pan" as "pan", "move" as "move"]
  override default_order = 2
}
