import type {PanEvent, TapEvent, KeyEvent, UIEvent, MoveEvent} from "core/ui_events"
import {Dimensions} from "core/enums"
import type * as p from "core/properties"
import {isField} from "core/vectorization"
import {XYGlyph} from "../../glyphs/xy_glyph"
import {Rect} from "../../glyphs/rect"
import type {LRTB} from "../../glyphs/lrtb"
import {Block} from "../../glyphs/block"
import {Quad} from "../../glyphs/quad"
import {HBar} from "../../glyphs/hbar"
import {VBar} from "../../glyphs/vbar"
import {HStrip} from "../../glyphs/hstrip"
import {VStrip} from "../../glyphs/vstrip"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import type {ColumnarDataSource} from "../../sources/columnar_data_source"
import {EditTool, EditToolView} from "./edit_tool"
import {tool_icon_box_edit} from "styles/icons.css"
import {unreachable} from "core/util/assert"
import {entries, keys, dict} from "core/util/object"

export type BoxLikeGlyph = LRTB | Rect | HStrip | VStrip

export type BoxLikeGlyphRenderer = GlyphRenderer & {
  glyph: BoxLikeGlyph
  data_source: ColumnarDataSource
}

export class BoxEditToolView extends EditToolView {
  declare model: BoxEditTool
  _draw_basepoint: [number, number] | null

  protected _recent_renderers: GlyphRenderer[] = []

  override _tap(ev: TapEvent): void {
    if ((this._draw_basepoint != null) || (this._basepoint != null)) {
      return
    }
    this._recent_renderers = this._select_event(ev, this._select_mode(ev), this.model.renderers)
  }

  override _keyup(ev: KeyEvent): void {
    if (!this.model.active || !this._mouse_in_frame) {
      return
    }
    for (const renderer of this.model.renderers) {
      if (ev.key == "Backspace") {
        this._delete_selected(renderer)
      } else if (ev.key == "Escape") {
        // Type properly once selection_manager is typed
        const cds = renderer.data_source
        cds.selection_manager.clear()
      }
    }
  }

  _set_extent([sx0, sx1]: [number, number], [sy0, sy1]: [number, number],
              append: boolean, emit: boolean = false): void {
    const renderer = this._recent_renderers[0] ?? this.model.renderers[0]
    const renderer_view = this.plot_view.views.find_one(renderer)
    if (renderer_view == null) {
      return
    }
    const {glyph} = renderer
    const cds = renderer.data_source
    const data = dict(cds.data)
    const [dx0, dx1] = renderer_view.coordinates.x_scale.r_invert(sx0, sx1)
    const [dy0, dy1] = renderer_view.coordinates.y_scale.r_invert(sy0, sy1)
    const fields: {[key: string]: number} | null = (() => {
      if (glyph instanceof Rect) {
        const {x, y, width, height} = glyph
        if (isField(x) && isField(y) && isField(width) && isField(height)) {
          return {
            [x.field]: (dx0 + dx1)/2,
            [y.field]: (dy0 + dy1)/2,
            [width.field]:  dx1 - dx0,
            [height.field]: dy1 - dy0,
          }
        }
      } else if (glyph instanceof Block) {
        const {x, y, width, height} = glyph
        if (isField(x) && isField(y) && isField(width) && isField(height)) {
          return {
            [x.field]:      dx0,
            [y.field]:      dy0,
            [width.field]:  dx1 - dx0,
            [height.field]: dy1 - dy0,
          }
        }
      } else if (glyph instanceof Quad) {
        const {right, bottom, left, top} = glyph
        if (isField(right) && isField(bottom) && isField(left) && isField(top)) {
          return {
            [right.field]:  dx1,
            [bottom.field]: dy0,
            [left.field]:   dx0,
            [top.field]:    dy1,
          }
        }
      } else if (glyph instanceof HBar) {
        const {left, y, height, right} = glyph
        if (isField(left) && isField(y) && isField(height) && isField(right)) {
          return {
            [left.field]:   dx0,
            [y.field]:      (dy0 + dy1)/2.0,
            [height.field]: dy1 - dy0,
            [right.field]:  dx1,
          }
        }
      } else if (glyph instanceof VBar) {
        const {x, bottom, width, top} = glyph
        if (isField(x) && isField(bottom) && isField(width) && isField(top)) {
          return {
            [x.field]:      (dx0 + dx1)/2.0,
            [bottom.field]: dy0,
            [width.field]:  dx1 - dx0,
            [top.field]:    dy1,
          }
        }
      } else if (glyph instanceof HStrip) {
        const {y0, y1} = glyph
        if (isField(y0) && isField(y1)) {
          return {
            [y0.field]: dy0,
            [y1.field]: dy1,
          }
        }
      } else if (glyph instanceof VStrip) {
        const {x0, x1} = glyph
        if (isField(x0) && isField(x1)) {
          return {
            [x0.field]: dx0,
            [x1.field]: dx1,
          }
        }
      } else {
        unreachable(`'${glyph.type}' is not supported"`)
      }
      return null
    })()

    if (fields == null) {
      return
    }

    if (append) {
      this._pop_glyphs(cds, this.model.num_objects)
      for (const [key, val] of entries(fields)) {
        cds.get_array(key).push(val)
      }
      this._pad_empty_columns(cds, keys(fields))
    } else {
      const length = cds.get_length()
      if (length == null) {
        return
      }
      const index = length - 1
      for (const [key, val] of entries(fields)) {
        data.get(key)![index] = val
      }
    }
    this._emit_cds_changes(cds, true, false, emit)
  }

  _update_box(ev: UIEvent, append: boolean = false, emit: boolean = false): void {
    if (this._draw_basepoint == null) {
      return
    }
    const curpoint: [number, number] = [ev.sx, ev.sy]
    const frame = this.plot_view.frame
    const dims = this.model.dimensions
    const [sxlim, sylim] = this.model._get_dim_limits(this._draw_basepoint, curpoint, frame, dims)
    this._set_extent(sxlim, sylim, append, emit)
  }

  override _press(ev: TapEvent): void {
    if (!this.model.active) {
      return
    }
    if (this._draw_basepoint != null) {
      this._update_box(ev, false, true)
      this._draw_basepoint = null
    } else {
      this._draw_basepoint = [ev.sx, ev.sy]
      this._select_event(ev, "append", this.model.renderers)
      this._update_box(ev, true, false)
    }
  }

  override _move(ev: MoveEvent): void {
    this._update_box(ev, false, false)
  }

  override _pan_start(ev: PanEvent): void {
    if (ev.modifiers.shift) {
      if (this._draw_basepoint != null) {
        return
      }
      this._draw_basepoint = [ev.sx, ev.sy]
      this._update_box(ev, true, false)
    } else {
      if (this._basepoint != null) {
        return
      }
      this._recent_renderers = this._select_event(ev, "append", this.model.renderers)
      this._basepoint = [ev.sx, ev.sy]
    }
  }

  override _pan(ev: PanEvent, append: boolean = false, emit: boolean = false): void {
    if (ev.modifiers.shift) {
      if (this._draw_basepoint == null) {
        return
      }
      this._update_box(ev, append, emit)
    } else {
      if (this._basepoint == null) {
        return
      }
      this._drag_points(ev, this.model.renderers)
    }
  }

  override _drag_points(ev: UIEvent, renderers: GlyphRenderer[], dim: Dimensions = "both"): void {
    if (this._basepoint == null) {
      return
    }
    const [bx, by] = this._basepoint
    for (const renderer of renderers) {
      const basepoint = this._map_drag(bx, by, renderer)
      const point = this._map_drag(ev.sx, ev.sy, renderer)
      if (point == null || basepoint == null) {
        continue
      }
      const [x, y] = point
      const [px, py] = basepoint

      const dx = dim == "width" || dim == "both" ? x - px : 0
      const dy = dim == "height" || dim == "both" ? y - py : 0

      const {glyph} = renderer
      const cds = renderer.data_source
      const data = dict(cds.data)

      const fields: {[key: string]: number} = {}
      if (glyph instanceof XYGlyph) {
        const {x, y} = glyph
        if (isField(x)) {
          fields[x.field] = dx
        }
        if (isField(y)) {
          fields[y.field] = dy
        }
      } else if (glyph instanceof Block) {
        const {x, y} = glyph
        if (isField(x)) {
          fields[x.field] = dx
        }
        if (isField(y)) {
          fields[y.field] = dy
        }
      } else if (glyph instanceof Quad) {
        const {right, bottom, left, top} = glyph
        if (isField(left) && isField(right)) {
          fields[left.field]  = dx
          fields[right.field] = dx
        }
        if (isField(top) && isField(bottom)) {
          fields[top.field]    = dy
          fields[bottom.field] = dy
        }
      } else if (glyph instanceof HBar) {
        const {left, right, y} = glyph
        if (isField(left) && isField(right)) {
          fields[left.field]  = dx
          fields[right.field] = dx
        }
        if (isField(y)) {
          fields[y.field] = dy
        }
      } else if (glyph instanceof VBar) {
        const {x, top, bottom} = glyph
        if (isField(x)) {
          fields[x.field] = dx
        }
        if (isField(top) && isField(bottom)) {
          fields[top.field]    = dy
          fields[bottom.field] = dy
        }
      } else if (glyph instanceof HStrip) {
        const {y0, y1} = glyph
        if (isField(y0) && isField(y1)) {
          fields[y0.field] = dy
          fields[y1.field] = dy
        }
      } else if (glyph instanceof VStrip) {
        const {x0, x1} = glyph
        if (isField(x0) && isField(x1)) {
          fields[x0.field] = dx
          fields[x1.field] = dx
        }
      } else {
        unreachable(`'${glyph.type}' is not supported"`)
      }

      for (const index of cds.selected.indices) {
        for (const [key, val] of entries(fields)) {
          const column = (data.get(key) ?? []) as number[]
          column[index] += val
        }
      }

      cds.change.emit()
    }
    this._basepoint = [ev.sx, ev.sy]
  }

  override _pan_end(ev: PanEvent): void {
    this._pan(ev, false, true)
    if (ev.modifiers.shift) {
      this._draw_basepoint = null
    } else {
      this._basepoint = null
      for (const renderer of this.model.renderers) {
        this._emit_cds_changes(renderer.data_source, false, true, true)
      }
    }
  }
}

export namespace BoxEditTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = EditTool.Props & {
    dimensions: p.Property<Dimensions>
    num_objects: p.Property<number>
    renderers: p.Property<BoxLikeGlyphRenderer[]>
  }
}

export interface BoxEditTool extends BoxEditTool.Attrs {}

export class BoxEditTool extends EditTool {
  declare properties: BoxEditTool.Props
  declare __view_type__: BoxEditToolView

  constructor(attrs?: Partial<BoxEditTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BoxEditToolView

    this.define<BoxEditTool.Props>(({Int, List, Ref}) => ({
      dimensions:  [ Dimensions, "both" ],
      num_objects: [ Int, 0 ],
      renderers:   [ List(Ref<BoxLikeGlyphRenderer>(GlyphRenderer as any)), [] ],
    }))
  }

  override tool_name = "Box Edit Tool"
  override tool_icon = tool_icon_box_edit
  override event_type = ["tap" as "tap", "press" as "press", "pan" as "pan", "move" as "move"]
  override default_order = 1
}
