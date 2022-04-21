import {Annotation, AnnotationView} from "./annotation"
import {Scale} from "../scales/scale"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import {PanEvent, Pannable, MoveEvent, Moveable} from "core/ui_events"
import {Signal} from "core/signaling"
import {CoordinateUnits} from "core/enums"
import * as p from "core/properties"
import * as cursors from "core/util/cursors"
import {assert, unreachable} from "core/util/assert"
import {BBox, LTRB} from "core/util/bbox"
import {clamp, sign, absmin} from "core/util/math"

export const EDGE_TOLERANCE = 2.5

const {abs} = Math

type Corner = "top_left" | "top_right" | "bottom_left" | "bottom_right"
type Edge = "left" | "right" | "top" | "bottom"
type HitTarget = Corner | Edge | "box"

export enum Directions {
  None   = 0b00,
  X      = 0b01,
  Y      = 0b10,
  All    = X | Y,
}

export enum Edges {
  None   = 0b0000,
  Left   = 0b0001,
  Right  = 0b0010,
  Top    = 0b0100,
  Bottom = 0b1000,
  X      = Left | Right,
  Y      = Top | Bottom,
  All    = X | Y,
}

export class BoxAnnotationView extends AnnotationView implements Pannable, Moveable {
  override model: BoxAnnotation
  override visuals: BoxAnnotation.Visuals

  protected bbox: BBox = new BBox()
  protected min_bbox: BBox = new BBox()
  protected max_bbox: BBox = new BBox()

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

    this.bbox = BBox.from_ltrb({
      left:   left != null ? this.left_coordinates.compute(left) : this.parent.bbox.left,
      right:  right != null ? this.right_coordinates.compute(right) : this.parent.bbox.right,
      top:    top != null ? this.top_coordinates.compute(top) : this.parent.bbox.top,
      bottom: bottom != null ? this.bottom_coordinates.compute(bottom) : this.parent.bbox.bottom,
    })

    const {min_left, min_right, min_top, min_bottom} = this.model
    this.min_bbox = BBox.from_ltrb({
      left:   min_left != null ? this.left_coordinates.compute(min_left) : this.parent.bbox.left,
      right:  min_right != null ? this.right_coordinates.compute(min_right) : this.parent.bbox.left,
      top:    min_top != null ? this.top_coordinates.compute(min_top) : this.parent.bbox.top,
      bottom: min_bottom != null ? this.bottom_coordinates.compute(min_bottom) : this.parent.bbox.top,
    })

    const {max_left, max_right, max_top, max_bottom} = this.model
    this.max_bbox = BBox.from_ltrb({
      left:   max_left != null ? this.left_coordinates.compute(max_left) : this.parent.bbox.right,
      right:  max_right != null ? this.right_coordinates.compute(max_right) : this.parent.bbox.right,
      top:    max_top != null ? this.top_coordinates.compute(max_top) : this.parent.bbox.bottom,
      bottom: max_bottom != null ? this.bottom_coordinates.compute(max_bottom) : this.parent.bbox.bottom,
    })

    this._paint_box()
  }

  protected _paint_box(): void {
    const {ctx} = this.layer
    ctx.save()

    if (this.model.highlight) {
      ctx.beginPath()
      ctx.rect(this.parent.bbox)
      ctx.rect(this.bbox)

      this.visuals.highlight_fill.apply(ctx, "evenodd")
      this.visuals.highlight_hatch.apply(ctx, "evenodd")
    }

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

  get resizable(): LTRB<boolean> {
    const {resizable} = this.model
    return {
      left: (resizable & Edges.Left) != 0,
      right: (resizable & Edges.Right) != 0,
      top: (resizable & Edges.Top) != 0,
      bottom: (resizable & Edges.Bottom) != 0,
    }
  }

  private _can_hit(target: HitTarget): boolean {
    const {left, right, top, bottom} = this.resizable
    switch (target) {
      case "top_left":     return top && left
      case "top_right":    return top && right
      case "bottom_left":  return bottom && left
      case "bottom_right": return bottom && right
      case "left":         return left
      case "right":        return right
      case "top":          return top
      case "bottom":       return bottom
      case "box":          return this.model.movable != Directions.None
    }
  }

  private _pan_state: {bbox: BBox, target: HitTarget} | null = null

  on_pan_start(ev: PanEvent): boolean {
    if (this.model.visible && this.model.editable) {
      const {sx, sy} = ev
      const target = this._hit_test(sx, sy)
      if (target != null && this._can_hit(target)) {
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

    const sltrb = BBox.from_ltrb((() => {
      const {bbox, target} = this._pan_state
      const {left, top, right, bottom} = bbox
      const {min_bbox: min, max_bbox: max} = this

      if (target == "box") {
        const [fdx, fdy] = (() => {
          switch (this.model.movable) {
            case Directions.All:  return [dx, dy]
            case Directions.X:    return [dx, 0]
            case Directions.Y:    return [0, dy]
            case Directions.None: return [0, 0]
            default:              unreachable() // XXX: TypeScript limitation
          }
        })()

        function limit(v: number, d: number, min: number, max: number) {
          if (v + d < min)
            return sign(d)*(v - min)
          else if (v + d > max)
            return sign(d)*(max - v)
          else
            return d
        }

        const dl = limit(left, fdx, min.left, max.left)
        const dr = limit(right, fdx, min.right, max.right)
        const dt = limit(top, fdy, min.top, max.top)
        const db = limit(bottom, fdy, min.bottom, max.bottom)

        const ffdx = absmin(dl, dr)
        const ffdy = absmin(dt, db)

        return {left: left + ffdx, top: top + ffdy, right: right + ffdx, bottom: bottom + ffdy}
      } else {
        const ltrb = (() => {
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
          }
        })()

        return {
          left: clamp(ltrb.left, min.left, max.left),
          right: clamp(ltrb.right, min.right, max.right),
          top: clamp(ltrb.top, min.top, max.top),
          bottom: clamp(ltrb.bottom, min.bottom, max.bottom),
        }
      }
    })())

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
    if (target == null || !this._can_hit(target))
      return null

    switch (target) {
      case "top_left":     return this.model.tl_cursor
      case "top_right":    return this.model.tr_cursor
      case "bottom_left":  return this.model.bl_cursor
      case "bottom_right": return this.model.br_cursor
      case "left":
      case "right":        return this.model.ew_cursor
      case "top":
      case "bottom":       return this.model.ns_cursor
      case "box": {
        const x = this.model.movable
        switch (x) {
          case Directions.All:  return this.model.in_cursor
          case Directions.X:    return this.model.ew_cursor
          case Directions.Y:    return this.model.ns_cursor
          case Directions.None: return null
          default:              unreachable() // XXX: TypeScript limitation
        }
      }
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

    highlight: p.Property<boolean>

    editable: p.Property<boolean>
    movable: p.Property<Directions> // Path
    resizable: p.Property<Edges>
    min_width: p.Property<number>
    max_width: p.Property<number>
    min_height: p.Property<number>
    max_height: p.Property<number>
    aspect: p.Property<number | null>
    min_left: p.Property<number | null>
    max_left: p.Property<number | null>
    min_right: p.Property<number | null>
    max_right: p.Property<number | null>
    min_top: p.Property<number | null>
    max_top: p.Property<number | null>
    min_bottom: p.Property<number | null>
    max_bottom: p.Property<number | null>

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
    mixins.HoverLine & mixins.HoverFill & mixins.HoverHatch &
    mixins.HighlightFill & mixins.HighlightHatch

  export type Visuals = Annotation.Visuals & {
    line: visuals.Line
    fill: visuals.Fill
    hatch: visuals.Hatch
    hover_line: visuals.Line
    hover_fill: visuals.Fill
    hover_hatch: visuals.Hatch
    highlight_fill: visuals.Fill
    highlight_hatch: visuals.Hatch
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
      ["highlight_", mixins.Fill],
      ["highlight_", mixins.Hatch],
    ])

    this.define<BoxAnnotation.Props>(({Boolean, Number, BitFlags, Nullable}) => ({
      top:          [ Nullable(Number), null ],
      bottom:       [ Nullable(Number), null ],
      left:         [ Nullable(Number), null ],
      right:        [ Nullable(Number), null ],
      top_units:    [ CoordinateUnits, "data" ],
      bottom_units: [ CoordinateUnits, "data" ],
      left_units:   [ CoordinateUnits, "data" ],
      right_units:  [ CoordinateUnits, "data" ],
      highlight:    [ Boolean, false ],
      editable:     [ Boolean, false ],
      movable:      [ BitFlags(Directions), Directions.All ],
      resizable:    [ BitFlags(Edges), Edges.All ],
      min_width:    [ Number, 0 ],
      max_width:    [ Number, Infinity ],
      min_height:   [ Number, 0 ],
      max_height:   [ Number, Infinity ],
      aspect:       [ Nullable(Number), null ],
      min_left:     [ Nullable(Number), null ],
      max_left:     [ Nullable(Number), null ],
      min_right:    [ Nullable(Number), null ],
      max_right:    [ Nullable(Number), null ],
      min_top:      [ Nullable(Number), null ],
      max_top:      [ Nullable(Number), null ],
      min_bottom:   [ Nullable(Number), null ],
      max_bottom:   [ Nullable(Number), null ],
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
      highlight_fill_color: "#7f7f7f",
      highlight_fill_alpha: 0.4,
    })
  }

  readonly pan = new Signal<"pan:start" | "pan" | "pan:end", this>(this, "pan")

  update({left, right, top, bottom}: LTRB<number | null>): void {
    this.setv({left, right, top, bottom, visible: true})
  }

  clear(): void {
    this.visible = false
  }
}
