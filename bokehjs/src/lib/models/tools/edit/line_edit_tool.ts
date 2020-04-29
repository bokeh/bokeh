import { Keys } from "core/dom"
//import { PanEvent, MoveEvent, KeyEvent, UIEvent } from "core/ui_events"
//import { PanEvent, TapEvent, MoveEvent, KeyEvent } from "core/ui_events"
import { PanEvent, TapEvent, KeyEvent } from "core/ui_events"
//import { isArray } from "core/util/types"
import { MultiLine } from "../../glyphs/multi_line"
//import { Line } from "../../glyphs/line"
import { GlyphRenderer } from "../../renderers/glyph_renderer"
import { LineTool, LineToolView } from "./line_tool"
import * as p from "core/properties"
import { bk_tool_icon_line_edit } from "styles/icons"
import { LineGLGlyph } from "models/glyphs/webgl";

export interface HasLineGlyph {
  glyph: MultiLine | LineGLGlyph
}

export class LineEditToolView extends LineToolView {
  model: LineEditTool

  _selected_renderer: GlyphRenderer | null
  _basepoint: [number, number] | null
  _drawing: boolean = false

  _doubletap(ev: TapEvent): void {
    if (!this.model.active)
      return
    console.log(ev)
  }
  /*
  const point = this._map_drag(ev.sx, ev.sy, this.model.intersection_renderer)
  if (point == null)
    return
  const [x, y] = point
  console.log("simon says" + x, + y)
  // Perform hit testing
  const point_selected = this._select_event(ev, false, [this.model.intersection_renderer])
  console.log("point selected is " + point_selected)
  const point_cds = this.model.intersection_renderer.data_source

  // Type once dataspecs are typed
  const point_glyph: any = this.model.intersection_renderer.glyph
  const [pxkey, pykey] = [point_glyph.x.field, point_glyph.y.field]
  if (point_selected.length && this._selected_renderer != null) {
    // Insert a new point after the selected vertex and enter draw mode
    const index = point_cds.selected.indices[0]
    if (this._drawing) {
      this._drawing = false
      point_cds.selection_manager.clear()
    } else {
      point_cds.selected.indices = [index + 1]
      if (pxkey) point_cds.get_array(pxkey).splice(index + 1, 0, x)
      if (pykey) point_cds.get_array(pykey).splice(index + 1, 0, y)
      this._drawing = true
    }
    point_cds.change.emit()
    this._emit_cds_changes(this._selected_renderer.data_source)
  } else {
    this._show_intersections(ev)
  }
}
  */
  _show_intersections(): void {
    if (!this.model.active)
      return

    const renderers = this.model.renderers
    if (!renderers.length) {
      this._set_intersection([], [])
      this._selected_renderer = null
      this._drawing = false
      return
    }

    const renderer = renderers[0]
    const cds = renderer.data_source
    let x: number[]
    let y: number[]
    x = Array.from(cds.data.x)
    y = Array.from(cds.data.y)
    this._selected_renderer = renderer
    this._set_intersection(x, y)
  }

  _tap(ev: TapEvent): void {
    const renderer = this.model.intersection_renderer
    const point = this._map_drag(ev.sx, ev.sy, renderer)
    if (point == null)
      return
    else if (this._drawing && this._selected_renderer) {
      const append = ev.shiftKey
      const selected_points = this._select_event(ev, append, [renderer])
      if (selected_points.length == 0) {
        console.log('no point selected')
        return
      }
    }
    const append = ev.shiftKey
    this._select_event(ev, append, [renderer])
    this._select_event(ev, append, this.model.renderers)
  }

  update_line_cds(): void {
    if (this._selected_renderer == null)
      return
    console.log("update line")
    const point_glyph: any = this.model.intersection_renderer.glyph
    const point_cds = this.model.intersection_renderer.data_source
    const [pxkey, pykey] = [point_glyph.x.field, point_glyph.y.field]
    if (pxkey && pykey) {
      const x = point_cds.data[pxkey]
      const y = point_cds.data[pykey]
      this._selected_renderer.data_source.data[pxkey] = x
      this._selected_renderer.data_source.data[pykey] = y
    }
    this._emit_cds_changes(this._selected_renderer.data_source, true, true, false)
  }

  _pan_start(ev: PanEvent): void {
    this._select_event(ev, true, [this.model.intersection_renderer])
    this._basepoint = [ev.sx, ev.sy]
  }

  _pan(ev: PanEvent): void {
    if (this._basepoint == null)
      return
    this._drag_points(ev, [this.model.intersection_renderer])
    if (this._selected_renderer)
      this._selected_renderer.data_source.change.emit()
  }

  _pan_end(ev: PanEvent): void {
    if (this._basepoint == null)
      return
    this._drag_points(ev, [this.model.intersection_renderer])
    this._emit_cds_changes(this.model.intersection_renderer.data_source, false, true, true)
    if (this._selected_renderer) {
      this._emit_cds_changes(this._selected_renderer.data_source)
    }
    this._basepoint = null
  }

  _keyup(ev: KeyEvent): void {
    if (!this.model.active || !this._mouse_in_frame)
      return
    let renderers: GlyphRenderer[]
    if (this._selected_renderer) {
      renderers = [this.model.intersection_renderer]
    } else {
      renderers = this.model.renderers
    }
    for (const renderer of renderers) {
      if (ev.keyCode === Keys.Backspace) {
        this._delete_selected(renderer)
        if (this._selected_renderer) {
          this._emit_cds_changes(this._selected_renderer.data_source)
        }
      } else if (ev.keyCode == Keys.Esc) {
        if (this._drawing) {
          // this._remove_vertex()
          this._drawing = false
        } else if (this._selected_renderer) {
          this._hide_intersections()
        }
        renderer.data_source.selection_manager.clear()
      }
    }
  }

  activate(): void {
    console.log("activate")
    this._drawing = true
    this._show_intersections()
    this.update_line_cds()
  }
  deactivate(): void {
    if (!this._selected_renderer) {
      return
    } else if (this._drawing) {
      //this._remove_vertex()
      this._drawing = false
    }
    this._hide_intersections()
  }
}

export namespace LineEditTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LineTool.Props
}

export interface LineEditTool extends LineEditTool.Attrs { }

export class LineEditTool extends LineTool {
  properties: LineEditTool.Props

  constructor(attrs?: Partial<LineEditTool.Attrs>) {
    super(attrs)
  }

  static init_LineEditTool(): void {
    this.prototype.default_view = LineEditToolView
  }

  tool_name = "Line Edit Tool"
  icon = bk_tool_icon_line_edit
  event_type = ["tap" as "tap", "pan" as "pan", "move" as "move"]
  default_order = 4
}
