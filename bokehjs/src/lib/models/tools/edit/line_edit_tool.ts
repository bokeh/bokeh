import {PanEvent, TapEvent} from "core/ui_events"
import {Dimensions} from "core/enums"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {LineTool, LineToolView} from "./line_tool"
import * as p from "core/properties"
import {bk_tool_icon_line_edit} from "styles/icons"
import {Line} from "models/glyphs/line"

export interface HasLineGlyph {
  glyph: Line
}

export class LineEditToolView extends LineToolView {
  model: LineEditTool

  _selected_renderer: GlyphRenderer | null
  _basepoint: [number, number] | null
  _drawing: boolean = false

  _doubletap(ev: TapEvent): void {
    if (!this.model.active)
      return

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
    if (!this.model.active)
      return

    if (this._selected_renderer == null)
      return

    const renderers = this.model.renderers
    if (!renderers.length) {
      this._set_intersection([], [])
      this._selected_renderer = null
      this._drawing = false
      return
    }

    const cds = this._selected_renderer.data_source

    const glyph: any = this._selected_renderer.glyph
    const [xkey, ykey] = [glyph.x.field, glyph.y.field]

    const x = cds.get_array(xkey) as number[]
    const y = cds.get_array(ykey) as number[]

    this._set_intersection(x, y)
  }

  _tap(ev: TapEvent): void {
    const renderer = this.model.intersection_renderer
    const point = this._map_drag(ev.sx, ev.sy, renderer)
    if (point == null)
      return
    else if (this._drawing && this._selected_renderer) {
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
    if (this._selected_renderer == null)
      return
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
    this._select_event(ev, "append", [this.model.intersection_renderer])
    this._basepoint = [ev.sx, ev.sy]
  }

  _pan(ev: PanEvent): void {
    if (this._basepoint == null)
      return
    this._drag_points(ev, [this.model.intersection_renderer], this.model.dimensions)
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

  activate(): void {
    this._drawing = true
  }

  deactivate(): void {
    if (!this._selected_renderer) {
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
  }
}

export interface LineEditTool extends LineEditTool.Attrs { }

export class LineEditTool extends LineTool {
  properties: LineEditTool.Props
  __view_type__: LineEditToolView
  constructor(attrs?: Partial<LineEditTool.Attrs>) {
    super(attrs)
  }

  static init_LineEditTool(): void {
    this.prototype.default_view = LineEditToolView
    this.define<LineEditTool.Props>({
      dimensions: [ p.Dimensions, "both" ],
    })
  }

  tool_name = "Line Edit Tool"
  icon = bk_tool_icon_line_edit
  event_type = ["tap" as "tap", "pan" as "pan", "move" as "move"]
  default_order = 4

  get tooltip(): string {
    return this._get_dim_tooltip(this.tool_name, this.dimensions)
  }
}
