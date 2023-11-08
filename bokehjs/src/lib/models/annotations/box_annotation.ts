import {Annotation, AnnotationView} from "./annotation"
import type {Scale} from "../scales/scale"
import type {AutoRanged} from "../ranges/data_range1d"
import {auto_ranged} from "../ranges/data_range1d"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import type {SerializableState} from "core/view"
import {CoordinateUnits} from "core/enums"
import type * as p from "core/properties"
import type {LRTB, Corners, CoordinateMapper} from "core/util/bbox"
import {min as amin} from "core/util/array"
import {BBox, empty} from "core/util/bbox"
import type {PanEvent, PinchEvent, Pannable, Pinchable, MoveEvent, Moveable, KeyModifiers} from "core/ui_events"
import {Signal} from "core/signaling"
import type {Rect} from "core/types"
import {assert} from "core/util/assert"
import {Enum, Number, Nullable, Ref, Or} from "../../core/kinds"
import {BorderRadius} from "../common/kinds"
import {round_rect} from "../common/painting"
import * as resolve from "../common/resolve"
import {Node} from "../coordinates/node"

export const EDGE_TOLERANCE = 2.5

const {abs} = Math

type Corner = "top_left" | "top_right" | "bottom_left" | "bottom_right"
type Edge = "left" | "right" | "top" | "bottom"
type HitTarget = Corner | Edge | "area"

const Resizable = Enum("none", "left", "right", "top", "bottom", "x", "y", "all")
type Resizable = typeof Resizable["__type__"]

const Movable = Enum("none", "x", "y", "both")
type Movable = typeof Movable["__type__"]

const Limit = Nullable(Or(Number, Ref(Node)))
type Limit = typeof Limit["__type__"]

export class BoxAnnotationView extends AnnotationView implements Pannable, Pinchable, Moveable, AutoRanged {
  declare model: BoxAnnotation
  declare visuals: BoxAnnotation.Visuals

  override bbox: BBox = new BBox()

  override serializable_state(): SerializableState {
    return {...super.serializable_state(), bbox: this.bbox.round()} // TODO: probably round earlier
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_render())
  }

  readonly [auto_ranged] = true

  bounds(): Rect {
    const {
      left, left_units,
      right, right_units,
      top, top_units,
      bottom, bottom_units,
    } = this.model

    const left_ok = left_units == "data" && !(left instanceof Node)
    const right_ok = right_units == "data" && !(right instanceof Node)
    const top_ok = top_units == "data" && !(top instanceof Node)
    const bottom_ok = bottom_units == "data" && !(bottom instanceof Node)

    const [x0, x1] = (() => {
      if (left_ok && right_ok)
        return left <= right ? [left, right] : [right, left]
      else if (left_ok)
        return [left, left]
      else if (right_ok)
        return [right, right]
      else
        return [NaN, NaN]
    })()

    const [y0, y1] = (() => {
      if (top_ok && bottom_ok)
        return top <= bottom ? [top, bottom] : [bottom, top]
      else if (top_ok)
        return [top, top]
      else if (bottom_ok)
        return [bottom, bottom]
      else
        return [NaN, NaN]
    })()

    return {x0, x1, y0, y1}
  }

  log_bounds(): Rect {
    return empty()
  }

  get mappers(): LRTB<CoordinateMapper> {
    function mapper(units: CoordinateUnits, scale: Scale, view: CoordinateMapper, canvas: CoordinateMapper) {
      switch (units) {
        case "canvas": return canvas
        case "screen": return view
        case "data":   return scale
      }
    }

    const overlay = this.model
    const {x_scale, y_scale} = this.coordinates
    const {x_view, y_view} = this.plot_view.frame.bbox
    const {x_screen, y_screen} = this.plot_view.canvas.bbox

    const lrtb = {
      left:   mapper(overlay.left_units,   x_scale, x_view, x_screen),
      right:  mapper(overlay.right_units,  x_scale, x_view, x_screen),
      top:    mapper(overlay.top_units,    y_scale, y_view, y_screen),
      bottom: mapper(overlay.bottom_units, y_scale, y_view, y_screen),
    }

    return lrtb
  }

  get border_radius(): Corners<number> {
    return resolve.border_radius(this.model.border_radius)
  }

  override compute_geometry(): void {
    super.compute_geometry()

    const compute = (dim: "x" | "y", value: number | Node, mapper: CoordinateMapper): number => {
      return value instanceof Node ? this.resolve_node(value)[dim] : mapper.compute(value)
    }

    const {left, right, top, bottom} = this.model
    const {mappers} = this

    this.bbox = BBox.from_lrtb({
      left:   compute("x", left,   mappers.left),
      right:  compute("x", right,  mappers.right),
      top:    compute("y", top,    mappers.top),
      bottom: compute("y", bottom, mappers.bottom),
    })
  }

  protected _render(): void {
    this.compute_geometry() // TODO: remove this

    if (!this.bbox.is_valid)
      return

    const {ctx} = this.layer
    ctx.save()

    ctx.beginPath()
    round_rect(ctx, this.bbox, this.border_radius)

    const {_is_hovered, visuals} = this
    const fill = _is_hovered && visuals.hover_fill.doit ? visuals.hover_fill : visuals.fill
    const hatch = _is_hovered && visuals.hover_hatch.doit ? visuals.hover_hatch : visuals.hatch
    const line = _is_hovered && visuals.hover_line.doit ? visuals.hover_line : visuals.line

    fill.apply(ctx)
    hatch.apply(ctx)
    line.apply(ctx)

    ctx.restore()
  }

  interactive_bbox(): BBox {
    const tolerance = this.model.line_width + EDGE_TOLERANCE
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

    const dl = abs(left - sx)
    const dr = abs(right - sx)
    const dt = abs(top - sy)
    const db = abs(bottom - sy)

    const hits_left = dl < tolerance && dl < dr
    const hits_right = dr < tolerance && dr < dl
    const hits_top = dt < tolerance && dt < db
    const hits_bottom = db < tolerance && db < dt

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
      return "area"

    return null
  }

  get resizable(): LRTB<boolean> {
    const {resizable} = this.model
    return {
      left: resizable == "left" || resizable == "x" || resizable == "all",
      right: resizable == "right" || resizable == "x" || resizable == "all",
      top: resizable == "top" || resizable == "y" || resizable == "all",
      bottom: resizable == "bottom" || resizable == "y" || resizable == "all",
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
      case "area":         return this.model.movable != "none"
    }
  }

  private _pan_state: {bbox: BBox, target: HitTarget} | null = null

  _pan_start(ev: PanEvent): boolean {
    if (this.model.visible && this.model.editable) {
      const {sx, sy} = ev
      const target = this._hit_test(sx, sy)
      if (target != null && this._can_hit(target)) {
        this._pan_state = {
          bbox: this.bbox.clone(),
          target,
        }
        this.model.pan.emit(["pan:start", ev.modifiers])
        return true
      }
    }
    return false
  }

  _pan(ev: PanEvent): void {
    assert(this._pan_state != null)

    const {mappers} = this

    const resolve = (dim: "x" | "y", limit: Node | number | null, mapper: CoordinateMapper): number => {
      if (limit instanceof Node) {
        return this.resolve_node(limit)[dim]
      } else if (limit == null) {
        return NaN
      } else {
        return mapper.compute(limit)
      }
    }

    const slimits = BBox.from_lrtb({
      left: resolve("x", this.model.left_limit, mappers.left),
      right: resolve("x", this.model.right_limit, mappers.right),
      top: resolve("y", this.model.top_limit, mappers.top),
      bottom: resolve("y", this.model.bottom_limit, mappers.bottom),
    })

    const [dl, dr, dt, db] = (() => {
      const {dx, dy} = ev
      const {target} = this._pan_state

      const {symmetric} = this.model
      const [Dx, Dy] = symmetric ? [-dx, -dy] : [0, 0]

      switch (target) {
        // corners
        case "top_left":     return [dx, Dx, dy, Dy]
        case "top_right":    return [Dx, dx, dy, Dy]
        case "bottom_left":  return [dx, Dx, Dy, dy]
        case "bottom_right": return [Dx, dx, Dy, dy]
        // edges
        case "left":   return [dx, Dx, 0, 0]
        case "right":  return [Dx, dx, 0, 0]
        case "top":    return [0, 0, dy, Dy]
        case "bottom": return [0, 0, Dy, dy]
        // area
        case "area": {
          switch (this.model.movable) {
            case "both": return [dx, dx, dy, dy]
            case "x":    return [dx, dx,  0,  0]
            case "y":    return [ 0,  0, dy, dy]
            case "none": return [ 0,  0,  0,  0]
          }
        }
      }
    })()

    const slrtb = (() => {
      const min = (a: number, b: number) => amin([a, b])
      const sgn = (v: number) => v < 0 ? -1 : (v > 0 ? 1 : 0)

      const {bbox} = this._pan_state
      let {left, right, left_sign, right_sign} = (() => {
        const left = bbox.left + dl
        const right = bbox.right + dr
        const left_sign = sgn(dl)
        const right_sign = sgn(dr)
        if (left <= right) {
          return {left, right, left_sign, right_sign}
        } else {
          return {left: right, right: left, left_sign: right_sign, right_sign: left_sign}
        }
      })()
      let {top, bottom, top_sign, bottom_sign} = (() => {
        const top = bbox.top + dt
        const bottom = bbox.bottom + db
        const top_sign = sgn(dt)
        const bottom_sign = sgn(db)
        if (top <= bottom) {
          return {top, bottom, top_sign, bottom_sign}
        } else {
          return {top: bottom, bottom: top, top_sign: bottom_sign, bottom_sign: top_sign}
        }
      })()

      const Dl = left - slimits.left
      const Dr = slimits.right - right

      const Dh = min(Dl < 0 ? Dl : NaN, Dr < 0 ? Dr : NaN)
      if (isFinite(Dh) && Dh < 0) {
        left += -left_sign*(-Dh)
        right += -right_sign*(-Dh)
      }

      const Dt = top - slimits.top
      const Db = slimits.bottom - bottom

      const Dv = min(Dt < 0 ? Dt : NaN, Db < 0 ? Db : NaN)
      if (isFinite(Dv) && Dv < 0) {
        top += -top_sign*(-Dv)
        bottom += -bottom_sign*(-Dv)
      }

      return BBox.from_lrtb({left, right, top, bottom})
    })()

    const lrtb = (() => {
      const {left, right, top, bottom} = this.model
      return {
        left:   left   instanceof Node ? left   : mappers.left.invert(slrtb.left),
        right:  right  instanceof Node ? right  : mappers.right.invert(slrtb.right),
        top:    top    instanceof Node ? top    : mappers.top.invert(slrtb.top),
        bottom: bottom instanceof Node ? bottom : mappers.bottom.invert(slrtb.bottom),
      }
    })()

    this.model.update(lrtb)
    this.model.pan.emit(["pan", ev.modifiers])
  }

  _pan_end(ev: PanEvent): void {
    this._pan_state = null
    this.model.pan.emit(["pan:end", ev.modifiers])
  }

  private _pinch_state: {bbox: BBox} | null = null

  _pinch_start(ev: PinchEvent): boolean {
    if (this.model.visible && this.model.editable && this.model.resizable != "none") {
      const {sx, sy} = ev
      if (this.bbox.contains(sx, sy)) {
        this._pinch_state = {
          bbox: this.bbox.clone(),
        }
        this.model.pan.emit(["pan:start", ev.modifiers]) // TODO: pinch signal
        return true
      }
    }
    return false
  }

  _pinch(ev: PinchEvent): void {
    assert(this._pinch_state != null)

    const slrtb = (() => {
      const {scale} = ev

      const {bbox} = this._pinch_state
      const {left, top, right, bottom, width, height} = bbox

      const dw = width*(scale - 1)
      const dh = height*(scale - 1)

      const {resizable} = this
      const dl = resizable.left ? -dw/2 : 0
      const dr = resizable.right ? dw/2 : 0
      const dt = resizable.top ? -dh/2 : 0
      const db = resizable.bottom ? dh/2 : 0

      return BBox.from_lrtb({
        left: left + dl,
        right: right + dr,
        top: top + dt,
        bottom: bottom + db,
      })
    })()

    const lrtb = (() => {
      const {left, right, top, bottom} = this.model
      const {mappers} = this
      return {
        left:   left   instanceof Node ? left   : mappers.left.invert(slrtb.left),
        right:  right  instanceof Node ? right  : mappers.right.invert(slrtb.right),
        top:    top    instanceof Node ? top    : mappers.top.invert(slrtb.top),
        bottom: bottom instanceof Node ? bottom : mappers.bottom.invert(slrtb.bottom),
      }
    })()

    this.model.update(lrtb)
    this.model.pan.emit(["pan", ev.modifiers])
  }

  _pinch_end(ev: PinchEvent): void {
    this._pinch_state = null
    this.model.pan.emit(["pan:end", ev.modifiers])
  }

  private get _has_hover(): boolean {
    const {hover_line, hover_fill, hover_hatch} = this.visuals
    return hover_line.doit || hover_fill.doit || hover_hatch.doit
  }

  private _is_hovered: boolean = false

  _move_start(_ev: MoveEvent): boolean {
    const {_has_hover} = this
    if (_has_hover) {
      this._is_hovered = true
      this.request_paint()
    }
    return _has_hover
  }

  _move(_ev: MoveEvent): void {}

  _move_end(_ev: MoveEvent): void {
    if (this._has_hover) {
      this._is_hovered = false
      this.request_paint()
    }
  }

  override cursor(sx: number, sy: number): string | null {
    const target = this._pan_state?.target ?? this._hit_test(sx, sy)
    if (target == null || !this._can_hit(target)) {
      return null
    }
    switch (target) {
      case "top_left":     return this.model.tl_cursor
      case "top_right":    return this.model.tr_cursor
      case "bottom_left":  return this.model.bl_cursor
      case "bottom_right": return this.model.br_cursor
      case "left":
      case "right":        return this.model.ew_cursor
      case "top":
      case "bottom":       return this.model.ns_cursor
      case "area": {
        switch (this.model.movable) {
          case "both": return this.model.in_cursor
          case "x":    return this.model.ew_cursor
          case "y":    return this.model.ns_cursor
          case "none": return null
        }
      }
    }
  }
}

export namespace BoxAnnotation {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    top: p.Property<number | Node>
    bottom: p.Property<number | Node>
    left: p.Property<number | Node>
    right: p.Property<number | Node>

    top_units: p.Property<CoordinateUnits>
    bottom_units: p.Property<CoordinateUnits>
    left_units: p.Property<CoordinateUnits>
    right_units: p.Property<CoordinateUnits>

    top_limit: p.Property<Limit>
    bottom_limit: p.Property<Limit>
    left_limit: p.Property<Limit>
    right_limit: p.Property<Limit>

    border_radius: p.Property<BorderRadius>

    editable: p.Property<boolean>
    resizable: p.Property<Resizable>
    movable: p.Property<Movable>
    symmetric: p.Property<boolean>

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
  declare properties: BoxAnnotation.Props
  declare __view_type__: BoxAnnotationView

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

    this.define<BoxAnnotation.Props>(({Boolean, Number, Ref, Or}) => ({
      top:          [ Or(Number, Ref(Node)), NaN ],
      bottom:       [ Or(Number, Ref(Node)), NaN ],
      left:         [ Or(Number, Ref(Node)), NaN ],
      right:        [ Or(Number, Ref(Node)), NaN ],

      top_units:    [ CoordinateUnits, "data" ],
      bottom_units: [ CoordinateUnits, "data" ],
      left_units:   [ CoordinateUnits, "data" ],
      right_units:  [ CoordinateUnits, "data" ],

      top_limit:    [ Limit, null ],
      bottom_limit: [ Limit, null ],
      left_limit:   [ Limit, null ],
      right_limit:  [ Limit, null ],

      border_radius: [ BorderRadius, 0 ],

      editable:     [ Boolean, false ],
      resizable:    [ Resizable, "all" ],
      movable:      [ Movable, "both" ],
      symmetric:    [ Boolean, false ],
    }))

    this.internal<BoxAnnotation.Props>(({String}) => ({
      tl_cursor: [ String, "nwse-resize" ],
      tr_cursor: [ String, "nesw-resize" ],
      bl_cursor: [ String, "nesw-resize" ],
      br_cursor: [ String, "nwse-resize" ],
      ew_cursor: [ String, "ew-resize" ],
      ns_cursor: [ String, "ns-resize" ],
      in_cursor: [ String, "move" ],
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

  readonly pan = new Signal<["pan:start" | "pan" | "pan:end", KeyModifiers], this>(this, "pan")

  update({left, right, top, bottom}: LRTB<number | Node>): void {
    this.setv({left, right, top, bottom, visible: true})
  }

  clear(): void {
    this.visible = false
  }
}
