import type {PanEvent, TapEvent} from "core/ui_events"
import {isField} from "core/vectorization"
import {Dimensions} from "core/enums"
import {dict} from "core/util/object"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {LineTool, LineToolView} from "./line_tool"
import type * as p from "core/properties"
import {tool_icon_line_edit} from "styles/icons.css"
import type {Line} from "models/glyphs/line"

export interface HasLineGlyph {
  glyph: Line
}

export class LineEditToolView extends LineToolView {
  declare model: LineEditTool

  _selected_renderer: GlyphRenderer<Line> | null
  _drawing: boolean = false

  override _press(ev: TapEvent): void {
    if (!this.model.active) {
      return
    }

    const renderers = this.model.renderers
    for (const renderer of renderers) {
      const line_selected = this._select_event(ev, "replace", [renderer])
      if (line_selected.length == 1) {
        this._selected_renderer = renderer
      }
    }
    this._show_intersections()
    this._update_line_cds()
  }

  _show_intersections(): void {
    if (!this.model.active) {
      return
    }

    if (this._selected_renderer == null) {
      return
    }

    const renderers = this.model.renderers
    if (renderers.length == 0) {
      this._set_intersection([], [])
      this._selected_renderer = null
      this._drawing = false
      return
    }

    const {glyph} = this._selected_renderer
    if (!isField(glyph.x) || !isField(glyph.y)) {
      return
    }

    const [xkey, ykey] = [glyph.x.field, glyph.y.field]

    const cds = this._selected_renderer.data_source
    const x = cds.get_array<number>(xkey)
    const y = cds.get_array<number>(ykey)

    this._set_intersection(x, y)
  }

  override _tap(ev: TapEvent): void {
    const renderer = this.model.intersection_renderer
    const point = this._map_drag(ev.sx, ev.sy, renderer)
    if (point == null) {
      return
    } else if (this._drawing && this._selected_renderer != null) {
      const mode = this._select_mode(ev)
      const selected_points = this._select_event(ev, mode, [renderer])
      if (selected_points.length == 0) {
        return
      }
    }
    const mode = this._select_mode(ev)
    this._select_event(ev, mode, [renderer])
    this._select_event(ev, mode, this.model.renderers)
  }

  _update_line_cds(): void {
    if (this._selected_renderer == null) {
      return
    }
    const point_glyph = this.model.intersection_renderer.glyph
    const point_cds = this.model.intersection_renderer.data_source
    const data = dict(point_cds.data)
    const pxkey = isField(point_glyph.x) ? point_glyph.x.field : null
    const pykey = isField(point_glyph.y) ? point_glyph.y.field : null
    if (pxkey != null && pykey != null) {
      const x = data.get(pxkey)
      const y = data.get(pykey)
      if (x != null) {
        dict(this._selected_renderer.data_source.data).set(pxkey, x)
      }
      if (y != null) {
        dict(this._selected_renderer.data_source.data).set(pykey, y)
      }
    }
    this._emit_cds_changes(this._selected_renderer.data_source, true, true, false)
  }

  override _pan_start(ev: PanEvent): void {
    this._select_event(ev, "append", [this.model.intersection_renderer])
    this._basepoint = [ev.sx, ev.sy]
  }

  override _pan(ev: PanEvent): void {
    if (this._basepoint == null) {
      return
    }
    this._drag_points(ev, [this.model.intersection_renderer], this.model.dimensions)
    if (this._selected_renderer != null) {
      this._selected_renderer.data_source.change.emit()
    }
  }

  override _pan_end(ev: PanEvent): void {
    if (this._basepoint == null) {
      return
    }
    this._drag_points(ev, [this.model.intersection_renderer])
    this._emit_cds_changes(this.model.intersection_renderer.data_source, false, true, true)
    if (this._selected_renderer != null) {
      this._emit_cds_changes(this._selected_renderer.data_source)
    }
    this._basepoint = null
  }

  override activate(): void {
    this._drawing = true
  }

  override deactivate(): void {
    if (this._selected_renderer == null) {
      return
    } else if (this._drawing) {
      this._drawing = false
    }
    this._hide_intersections()
  }
}

export namespace LineEditTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LineTool.Props & {
    dimensions: p.Property<Dimensions>
    renderers: p.Property<GlyphRenderer<Line>[]>
  }
}

export interface LineEditTool extends LineEditTool.Attrs { }

export class LineEditTool extends LineTool {
  declare properties: LineEditTool.Props
  declare __view_type__: LineEditToolView

  constructor(attrs?: Partial<LineEditTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LineEditToolView
    this.define<LineEditTool.Props>(({List, Ref}) => ({
      dimensions: [ Dimensions, "both" ],
      renderers:  [ List(Ref(GlyphRenderer<Line>)), [] ],
    }))
  }

  override tool_name = "Line Edit Tool"
  override tool_icon = tool_icon_line_edit
  override event_type = ["tap" as "tap", "press" as "press", "pan" as "pan", "move" as "move"]
  override default_order = 4

  override get tooltip(): string {
    return this._get_dim_tooltip(this.dimensions)
  }
}
