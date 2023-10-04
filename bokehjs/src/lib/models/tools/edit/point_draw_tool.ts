import type {PanEvent, TapEvent, KeyEvent} from "core/ui_events"
import type * as p from "core/properties"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import type {HasXYGlyph} from "./edit_tool"
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
    if (point == null)
      return

    // Type once dataspecs are typed
    const glyph: any = renderer.glyph
    const cds = renderer.data_source
    const [xkey, ykey] = [glyph.x.field, glyph.y.field]
    const [x, y] = point

    this._pop_glyphs(cds, this.model.num_objects)
    if (xkey) cds.get_array(xkey).push(x)
    if (ykey) cds.get_array(ykey).push(y)
    this._pad_empty_columns(cds, [xkey, ykey])

    const {data} = cds
    cds.setv({data}, {check_eq: false}) // XXX: inplace updates
  }

  override _keyup(ev: KeyEvent): void {
    if (!this.model.active || !this._mouse_in_frame)
      return
    for (const renderer of this.model.renderers) {
      if (ev.key == "Backspace") {
        this._delete_selected(renderer)
      } else if (ev.key == "Escape") {
        renderer.data_source.selection_manager.clear()
      }
    }
  }

  override _pan_start(ev: PanEvent): void {
    if (!this.model.drag)
      return
    this._select_event(ev, "append", this.model.renderers)
    this._basepoint = [ev.sx, ev.sy]
  }

  override _pan(ev: PanEvent): void {
    if (!this.model.drag || this._basepoint == null)
      return
    this._drag_points(ev, this.model.renderers)
  }

  override _pan_end(ev: PanEvent): void {
    if (!this.model.drag)
      return
    this._pan(ev)
    for (const renderer of this.model.renderers)
      this._emit_cds_changes(renderer.data_source, false, true, true)
    this._basepoint = null
  }
}

export namespace PointDrawTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = EditTool.Props & {
    add: p.Property<boolean>
    drag: p.Property<boolean>
    num_objects: p.Property<number>
    renderers: p.Property<(GlyphRenderer & HasXYGlyph)[]>
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

    this.define<PointDrawTool.Props>(({Boolean, Int, Array, Ref}) => ({
      add:         [ Boolean, true ],
      drag:        [ Boolean, true ],
      num_objects: [ Int, 0 ],
      renderers:   [ Array(Ref<GlyphRenderer & HasXYGlyph>(GlyphRenderer as any)), [] ],
    }))
  }

  override tool_name = "Point Draw Tool"
  override tool_icon = tool_icon_point_draw
  override event_type = ["tap" as "tap", "pan" as "pan", "move" as "move"]
  override default_order = 2
}
