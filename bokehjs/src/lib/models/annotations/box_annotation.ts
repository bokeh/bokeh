import {Annotation, AnnotationView} from "./annotation"
import {Scale} from "../scales/scale"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import {PanEvent, Pannable, MoveEvent, Moveable} from "core/ui_events"
import {Signal} from "core/signaling"
import {CoordinateUnits} from "core/enums"
import * as p from "core/properties"
import * as cursors from "core/util/cursors"
import {assert} from "core/util/assert"
import {BBox, LTRB} from "core/util/bbox"

export const EDGE_TOLERANCE = 2.5

const {abs} = Math

type Corner = "top_left" | "top_right" | "bottom_left" | "bottom_right"
type Edge = "left" | "right" | "top" | "bottom"
type HitTarget = Corner | Edge | "box"

export class BoxAnnotationView extends AnnotationView implements Pannable, Moveable {
  override model: BoxAnnotation
  override visuals: BoxAnnotation.Visuals

  protected bbox: BBox = new BBox()

  get left_coordinates(): Scale {
    switch (this.model.left_units) {
      case "canvas": return this.canvas.screen.x_scale
      case "screen": return this.parent.view.x_scale
      case "data":   return this.coordinates.x_scale
    }
  }

  get right_coordinates(): Scale {
    switch (this.model.right_units) {
      case "canvas": return this.canvas.screen.x_scale
      case "screen": return this.parent.view.x_scale
      case "data":   return this.coordinates.x_scale
    }
  }

  get top_coordinates(): Scale {
    switch (this.model.top_units) {
      case "canvas": return this.canvas.screen.y_scale
      case "screen": return this.parent.view.y_scale
      case "data":   return this.coordinates.y_scale
    }
  }

  get bottom_coordinates(): Scale {
    switch (this.model.bottom_units) {
      case "canvas": return this.canvas.screen.y_scale
      case "screen": return this.parent.view.y_scale
      case "data":   return this.coordinates.y_scale
    }
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_render())
  }

  protected _render(): void {
    const {left, right, top, bottom} = this.model

    this.bbox = BBox.from_rect({
      left:   left != null ? this.left_coordinates.compute(left) : this.parent.bbox.left,
      right:  right != null ? this.right_coordinates.compute(right) : this.parent.bbox.right,
      top:    top != null ? this.top_coordinates.compute(top) : this.parent.bbox.top,
      bottom: bottom != null ? this.bottom_coordinates.compute(bottom) : this.parent.bbox.bottom,
    })

    this._paint_box()
  }

  protected _paint_box(): void {
    const {ctx} = this.layer
    ctx.save()

    const {left, top, width, height} = this.bbox
    ctx.beginPath()
    ctx.rect(left, top, width, height)

    const fill = this._is_hovered && this.visuals.hover_fill.doit ? this.visuals.hover_fill : this.visuals.fill
    const hatch = this._is_hovered && this.visuals.hover_hatch.doit ? this.visuals.hover_hatch : this.visuals.hatch
    const line = this._is_hovered && this.visuals.hover_line.doit ? this.visuals.hover_line : this.visuals.line

    fill.apply(ctx)
    hatch.apply(ctx)
    line.apply(ctx)

    ctx.restore()
  }

  interactive_bbox(): BBox {
    const tolerance = Math.max(EDGE_TOLERANCE, this.model.line_width/2)
    return this.bbox.grow_by(tolerance)
  }

  override interactive_hit(sx: number, sy: number): boolean {
    if (!this.model.visible || !this.model.editable)
      return false
    const bbox = this.interactive_bbox()
    return bbox.contains(sx, sy)
  }

  private _hit_test(sx: number, sy: number): HitTarget | null {
    const {left, right, bottom, top} = this.bbox
    const tolerance = Math.max(EDGE_TOLERANCE, this.model.line_width/2)

    const hits_left = abs(left - sx) < tolerance
    const hits_right = abs(right - sx) < tolerance
    const hits_top = abs(top - sy) < tolerance
    const hits_bottom = abs(bottom - sy) < tolerance

    if (hits_top && hits_left)
      return "top_left"
    if (hits_top && hits_right)
      return "top_right"
    if (hits_bottom && hits_left)
      return "bottom_left"
    if (hits_bottom && hits_right)
      return "bottom_right"

    if (hits_left)
      return "left"
    if (hits_right)
      return "right"
    if (hits_top)
      return "top"
    if (hits_bottom)
      return "bottom"

    if (this.bbox.contains(sx, sy))
      return "box"

    return null
  }

  private _pan_state: {bbox: BBox, target: HitTarget} | null = null

  on_pan_start(ev: PanEvent): boolean {
    if (this.model.visible && this.model.editable) {
      const {sx, sy} = ev
      const target = this._hit_test(sx, sy)
      if (target != null) {
        this._pan_state = {
          bbox: this.bbox.clone(),
          target,
        }
        this.model.pan.emit("pan:start")
        return true
      }
    }
    return false
  }

  on_pan(ev: PanEvent): void {
    assert(this._pan_state != null)

    const dx = ev.deltaX
    const dy = ev.deltaY

    const sltrb = (() => {
      const {bbox, target} = this._pan_state
      const {left, top, right, bottom} = bbox

      switch (target) {
        case "top_left":
          return {left: left + dx, top: top + dy, right, bottom}
        case "top_right":
          return {left, top: top + dy, right: right + dx, bottom}
        case "bottom_left":
          return {left: left + dx, top, right, bottom: bottom + dy}
        case "bottom_right":
          return {left, top, right: right + dx, bottom: bottom + dy}
        case "left":
          return {left: left + dx, top, right, bottom}
        case "right":
          return {left, top, right: right + dx, bottom}
        case "top":
          return {left, top: top + dy, right, bottom}
        case "bottom":
          return {left, top, right, bottom: bottom + dy}
        case "box":
          return {left: left + dx, top: top + dy, right: right + dx, bottom: bottom + dy}
      }
    })()

    const ltrb = {
      left:   this.left_coordinates.invert(sltrb.left),
      right:  this.right_coordinates.invert(sltrb.right),
      top:    this.top_coordinates.invert(sltrb.top),
      bottom: this.bottom_coordinates.invert(sltrb.bottom),
    }

    this.model.update(ltrb)
    this.model.pan.emit("pan")
  }

  on_pan_end(_ev: PanEvent): void {
    this._pan_state = null
    this.model.pan.emit("pan:end")
  }

  private get _has_hover(): boolean {
    const {hover_line, hover_fill, hover_hatch} = this.visuals
    return hover_line.doit || hover_fill.doit || hover_hatch.doit
  }

  private _is_hovered: boolean = false

  on_move_start(_ev: MoveEvent): boolean {
    const {_has_hover} = this
    if (_has_hover) {
      this._is_hovered = true
      this.request_paint()
    }
    return _has_hover
  }

  on_move(_ev: MoveEvent): void {}

  on_move_end(_ev: MoveEvent): void {
    if (this._has_hover) {
      this._is_hovered = false
      this.request_paint()
    }
  }

  override cursor(sx: number, sy: number): string | null {
    const target = this._pan_state?.target ?? this._hit_test(sx, sy)
    switch (target) {
      case "top_left":     return this.model.tl_cursor
      case "top_right":    return this.model.tr_cursor
      case "bottom_left":  return this.model.bl_cursor
      case "bottom_right": return this.model.br_cursor
      case "left":         return this.model.ew_cursor
      case "right":        return this.model.ew_cursor
      case "top":          return this.model.ns_cursor
      case "bottom":       return this.model.ns_cursor
      case "box":          return this.model.in_cursor
      default:             return null
    }
  }
}

export namespace BoxAnnotation {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    top: p.Property<number | null>
    bottom: p.Property<number | null>
    left: p.Property<number | null>
    right: p.Property<number | null>
    top_units: p.Property<CoordinateUnits>
    bottom_units: p.Property<CoordinateUnits>
    left_units: p.Property<CoordinateUnits>
    right_units: p.Property<CoordinateUnits>
    editable: p.Property<boolean>
    tl_cursor: p.Property<string>
    tr_cursor: p.Property<string>
    bl_cursor: p.Property<string>
    br_cursor: p.Property<string>
    ew_cursor: p.Property<string>
    ns_cursor: p.Property<string>
    in_cursor: p.Property<string>
  } & Mixins

  export type Mixins =
    mixins.Line & mixins.Fill & mixins.Hatch &
    mixins.HoverLine & mixins.HoverFill & mixins.HoverHatch

  export type Visuals = Annotation.Visuals & {
    line: visuals.Line
    fill: visuals.Fill
    hatch: visuals.Hatch
    hover_line: visuals.Line
    hover_fill: visuals.Fill
    hover_hatch: visuals.Hatch
  }
}

export interface BoxAnnotation extends BoxAnnotation.Attrs {}

export class BoxAnnotation extends Annotation {
  override properties: BoxAnnotation.Props
  override __view_type__: BoxAnnotationView

  constructor(attrs?: Partial<BoxAnnotation.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BoxAnnotationView

    this.mixins<BoxAnnotation.Mixins>([
      mixins.Line,
      mixins.Fill,
      mixins.Hatch,
      ["hover_", mixins.Line],
      ["hover_", mixins.Fill],
      ["hover_", mixins.Hatch],
    ])

    this.define<BoxAnnotation.Props>(({Boolean, Number, Nullable}) => ({
      top:          [ Nullable(Number), null ],
      bottom:       [ Nullable(Number), null ],
      left:         [ Nullable(Number), null ],
      right:        [ Nullable(Number), null ],
      top_units:    [ CoordinateUnits, "data" ],
      bottom_units: [ CoordinateUnits, "data" ],
      left_units:   [ CoordinateUnits, "data" ],
      right_units:  [ CoordinateUnits, "data" ],
      editable:     [ Boolean, false ],
    }))

    this.internal<BoxAnnotation.Props>(({String}) => ({
      tl_cursor: [ String, "nwse-resize" ],
      tr_cursor: [ String, "nesw-resize" ],
      bl_cursor: [ String, "nesw-resize" ],
      br_cursor: [ String, "nwse-resize" ],
      ew_cursor: [ String, cursors.x_pan ],
      ns_cursor: [ String, cursors.y_pan ],
      in_cursor: [ String, cursors.pan ],
    }))

    this.override<BoxAnnotation.Props>({
      fill_color: "#fff9ba",
      fill_alpha: 0.4,
      line_color: "#cccccc",
      line_alpha: 0.3,
      hover_fill_color: null,
      hover_fill_alpha: 0.4,
      hover_line_color: null,
      hover_line_alpha: 0.3,
    })
  }

  readonly pan = new Signal<"pan:start" | "pan" | "pan:end", this>(this, "pan")

  update({left, right, top, bottom}: LTRB): void {
    this.setv({left, right, top, bottom, visible: true})
  }

  clear(): void {
    this.visible = false
  }
}
