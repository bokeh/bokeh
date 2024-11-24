import {Annotation, AnnotationView} from "./annotation"
import {Model} from "../../model"
import {AreaVisuals} from "./area_visuals"
import type {Scale} from "../scales/scale"
import type {AutoRanged} from "../ranges/data_range1d"
import {auto_ranged} from "../ranges/data_range1d"
import type {ViewOf, BuildResult} from "core/build_views"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import {CoordinateUnits} from "core/enums"
import type * as p from "core/properties"
import type {LRTB, Corners, CoordinateMapper} from "core/util/bbox"
import {min as amin} from "core/util/array"
import {BBox, empty} from "core/util/bbox"
import type {Context2d} from "core/util/canvas"
import type {PanEvent, PinchEvent, Pannable, Pinchable, MoveEvent, Moveable, KeyModifiers} from "core/ui_events"
import {Signal} from "core/signaling"
import type {Rect} from "core/types"
import {clamp} from "core/util/math"
import {assert} from "core/util/assert"
import {values} from "core/util/object"
import {BorderRadius} from "../common/kinds"
import * as Box from "../common/box_kinds"
import {round_rect} from "../common/painting"
import * as resolve from "../common/resolve"
import {Node} from "../coordinates/node"
import {Coordinate} from "../coordinates/coordinate"
import type {Renderer} from "../renderers/renderer"

export const EDGE_TOLERANCE = 2.5

const {abs} = Math

export namespace BoxInteractionHandles {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    all:          p.Property<AreaVisuals>        // move, resize

    move:         p.Property<AreaVisuals | null>
    resize:       p.Property<AreaVisuals | null> // sides, corners

    sides:        p.Property<AreaVisuals | null> // left, right, top, bottom
    corners:      p.Property<AreaVisuals | null> // top_left, top_right, bottom_left, bottom_right

    left:         p.Property<AreaVisuals | null>
    right:        p.Property<AreaVisuals | null>
    top:          p.Property<AreaVisuals | null>
    bottom:       p.Property<AreaVisuals | null>

    top_left:     p.Property<AreaVisuals | null>
    top_right:    p.Property<AreaVisuals | null>
    bottom_left:  p.Property<AreaVisuals | null>
    bottom_right: p.Property<AreaVisuals | null>
  }
}

export interface BoxInteractionHandles extends BoxInteractionHandles.Attrs {}

export class BoxInteractionHandles extends Model {
  declare properties: BoxInteractionHandles.Props
  declare __view_type__: BoxAnnotationView

  constructor(attrs?: Partial<BoxInteractionHandles.Attrs>) {
    super(attrs)
  }

  static {
    this.define<BoxInteractionHandles.Props>(({Ref, Nullable}) => ({
      all:          [ Ref(AreaVisuals) ],

      move:         [ Nullable(Ref(AreaVisuals)), null ],
      resize:       [ Nullable(Ref(AreaVisuals)), null ],

      sides:        [ Nullable(Ref(AreaVisuals)), null ],
      corners:      [ Nullable(Ref(AreaVisuals)), null ],

      left:         [ Nullable(Ref(AreaVisuals)), null ],
      right:        [ Nullable(Ref(AreaVisuals)), null ],
      top:          [ Nullable(Ref(AreaVisuals)), null ],
      bottom:       [ Nullable(Ref(AreaVisuals)), null ],

      top_left:     [ Nullable(Ref(AreaVisuals)), null ],
      top_right:    [ Nullable(Ref(AreaVisuals)), null ],
      bottom_left:  [ Nullable(Ref(AreaVisuals)), null ],
      bottom_right: [ Nullable(Ref(AreaVisuals)), null ],
    }))
  }
}

const DEFAULT_HANDLES = () => {
  return new BoxInteractionHandles({
    all: new AreaVisuals({
      fill_color: "white",
      fill_alpha: 1.0,
      line_color: "black",
      line_alpha: 1.0,
      hover_fill_color: "lightgray",
      hover_fill_alpha: 1.0,
    }),
  })
}

export class BoxAnnotationView extends AnnotationView implements Pannable, Pinchable, Moveable, AutoRanged {
  declare model: BoxAnnotation
  declare visuals: BoxAnnotation.Visuals

  protected _bbox: BBox = new BBox()
  override get bbox(): BBox {
    return this._bbox
  }

  protected _handles: {[key in Box.HitTarget]: BoxAnnotation | null}
  protected _handles_views: {[key in Box.HitTarget]?: ViewOf<BoxAnnotation>} = {}

  override initialize(): void {
    super.initialize()
    this._update_handles()
  }

  protected _update_handles(): void {
    const {editable, use_handles, handles} = this.model
    if (editable && use_handles) {
      const {movable, resizable} = this

      const common: Partial<BoxAnnotation.Attrs> = {
        visible: true,
        resizable: "none",
        left_units: "canvas",
        right_units: "canvas",
        top_units: "canvas",
        bottom_units: "canvas",
        level: this.model.level,
      }

      function attrs_of(source: AreaVisuals) {
        return {
          ...mixins.attrs_of(source, "",       mixins.Line, true),
          ...mixins.attrs_of(source, "",       mixins.Fill, true),
          ...mixins.attrs_of(source, "",       mixins.Hatch, true),
          ...mixins.attrs_of(source, "hover_", mixins.Line, true),
          ...mixins.attrs_of(source, "hover_", mixins.Fill, true),
          ...mixins.attrs_of(source, "hover_", mixins.Hatch, true),
        }
      }

      const h = handles
      const attrs = {
        area:         attrs_of(h.move ?? h.all),
        left:         attrs_of(h.left ?? h.sides ?? h.resize ?? h.all),
        right:        attrs_of(h.right ?? h.sides ?? h.resize ?? h.all),
        top:          attrs_of(h.top ?? h.sides ?? h.resize ?? h.all),
        bottom:       attrs_of(h.bottom ?? h.sides ?? h.resize ?? h.all),
        top_left:     attrs_of(h.top_left ?? h.corners ?? h.resize ?? h.all),
        top_right:    attrs_of(h.top_right ?? h.corners ?? h.resize ?? h.all),
        bottom_left:  attrs_of(h.bottom_left ?? h.corners ?? h.resize ?? h.all),
        bottom_right: attrs_of(h.bottom_right ?? h.corners ?? h.resize ?? h.all),
      }

      const {
        tl_cursor, tr_cursor, bl_cursor, br_cursor,
        ew_cursor, ns_cursor,
      } = this.model

      this._handles = {
        area:         movable                ? new BoxAnnotation({...common, ...attrs.area,         movable: this.model.movable}) : null,
        left:         resizable.left         ? new BoxAnnotation({...common, ...attrs.left,         in_cursor: ew_cursor}) : null,
        right:        resizable.right        ? new BoxAnnotation({...common, ...attrs.right,        in_cursor: ew_cursor}) : null,
        top:          resizable.top          ? new BoxAnnotation({...common, ...attrs.top,          in_cursor: ns_cursor}) : null,
        bottom:       resizable.bottom       ? new BoxAnnotation({...common, ...attrs.bottom,       in_cursor: ns_cursor}) : null,
        top_left:     resizable.top_left     ? new BoxAnnotation({...common, ...attrs.top_left,     in_cursor: tl_cursor}) : null,
        top_right:    resizable.top_right    ? new BoxAnnotation({...common, ...attrs.top_right,    in_cursor: tr_cursor}) : null,
        bottom_left:  resizable.bottom_left  ? new BoxAnnotation({...common, ...attrs.bottom_left,  in_cursor: bl_cursor}) : null,
        bottom_right: resizable.bottom_right ? new BoxAnnotation({...common, ...attrs.bottom_right, in_cursor: br_cursor}) : null,
      }
    } else {
      this._handles = {
        area:         null,
        left:         null,
        right:        null,
        top:          null,
        bottom:       null,
        top_left:     null,
        top_right:    null,
        bottom_left:  null,
        bottom_right: null,
      }
    }
  }

  override get computed_renderers(): Renderer[] {
    return [...super.computed_renderers, ...values(this._handles).filter((handle) => handle != null)]
  }

  override connect_signals(): void {
    super.connect_signals()
    const {editable, use_handles, handles, resizable, movable} = this.model.properties
    this.on_change([editable, use_handles, handles, resizable, movable], async () => {
      this._update_handles()
      await this._update_renderers()
    })
    this.connect(this.model.change, () => this.request_paint())
  }

  protected override async _build_renderers(): Promise<BuildResult<Renderer>> {
    const build_result = await super._build_renderers()

    const get = (handle: Renderer | null) => {
      return handle != null ? this._renderer_views.get(handle) as ViewOf<BoxAnnotation> | undefined : undefined
    }

    this._handles_views = {
      area:         get(this._handles.area),
      left:         get(this._handles.left),
      right:        get(this._handles.right),
      top:          get(this._handles.top),
      bottom:       get(this._handles.bottom),
      top_left:     get(this._handles.top_left),
      top_right:    get(this._handles.top_right),
      bottom_left:  get(this._handles.bottom_left),
      bottom_right: get(this._handles.bottom_right),
    }

    return build_result
  }

  readonly [auto_ranged] = true

  bounds(): Rect {
    const {
      left, left_units,
      right, right_units,
      top, top_units,
      bottom, bottom_units,
    } = this.model

    const left_ok = left_units == "data" && !(left instanceof Coordinate)
    const right_ok = right_units == "data" && !(right instanceof Coordinate)
    const top_ok = top_units == "data" && !(top instanceof Coordinate)
    const bottom_ok = bottom_units == "data" && !(bottom instanceof Coordinate)

    const [x0, x1] = (() => {
      if (left_ok && right_ok) {
        return left <= right ? [left, right] : [right, left]
      } else if (left_ok) {
        return [left, left]
      } else if (right_ok) {
        return [right, right]
      } else {
        return [NaN, NaN]
      }
    })()

    const [y0, y1] = (() => {
      if (top_ok && bottom_ok) {
        return top <= bottom ? [top, bottom] : [bottom, top]
      } else if (top_ok) {
        return [top, top]
      } else if (bottom_ok) {
        return [bottom, bottom]
      } else {
        return [NaN, NaN]
      }
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

    const bbox = (() => {
      const compute = (dim: "x" | "y", value: number | Coordinate, mapper: CoordinateMapper): number => {
        return value instanceof Coordinate ? this.resolve_as_scalar(value, dim) : mapper.compute(value)
      }

      const {left, right, top, bottom} = this.model
      const {mappers} = this

      return BBox.from_lrtb({
        left:   compute("x", left,   mappers.left),
        right:  compute("x", right,  mappers.right),
        top:    compute("y", top,    mappers.top),
        bottom: compute("y", bottom, mappers.bottom),
      })
    })()
    this._bbox = bbox

    const width = 10
    const height = 10

    function update(renderer: BoxAnnotation | null, bbox: BBox): void {
      const {left, right, top, bottom} = bbox
      renderer?.setv({left, right, top, bottom}, {silent: true})
    }

    update(this._handles.area, new BBox({...bbox.center, width, height, origin: "center"}))
    update(this._handles.left, new BBox({...bbox.center_left, width, height, origin: "center"}))
    update(this._handles.right, new BBox({...bbox.center_right, width, height, origin: "center"}))
    update(this._handles.top, new BBox({...bbox.top_center, width, height, origin: "center"}))
    update(this._handles.bottom, new BBox({...bbox.bottom_center, width, height, origin: "center"}))
    update(this._handles.top_left, new BBox({...bbox.top_left, width, height, origin: "center"}))
    update(this._handles.top_right, new BBox({...bbox.top_right, width, height, origin: "center"}))
    update(this._handles.bottom_left, new BBox({...bbox.bottom_left, width, height, origin: "center"}))
    update(this._handles.bottom_right, new BBox({...bbox.bottom_right, width, height, origin: "center"}))
  }

  protected _paint(ctx: Context2d): void {
    if (!this.bbox.is_valid) {
      return
    }

    const {_is_hovered, visuals} = this
    const fill = _is_hovered && visuals.hover_fill.doit ? visuals.hover_fill : visuals.fill
    const hatch = _is_hovered && visuals.hover_hatch.doit ? visuals.hover_hatch : visuals.hatch
    const line = _is_hovered && visuals.hover_line.doit ? visuals.hover_line : visuals.line

    ctx.save()

    if (!this.model.inverted) {
      ctx.beginPath()
      round_rect(ctx, this.bbox, this.border_radius)

      fill.apply(ctx)
      hatch.apply(ctx)
      line.apply(ctx)
    } else {
      ctx.beginPath()
      const parent = this.layout ?? this.plot_view.frame
      const {x, y, width, height} = parent.bbox
      ctx.rect(x, y, width, height)
      round_rect(ctx, this.bbox, this.border_radius)

      fill.apply(ctx, undefined, "evenodd")
      hatch.apply(ctx, undefined, "evenodd")

      ctx.beginPath()
      round_rect(ctx, this.bbox, this.border_radius)
      line.apply(ctx)
    }

    ctx.restore()
  }

  interactive_bbox(): BBox {
    const tolerance = this.model.line_width + EDGE_TOLERANCE
    return this.bbox.grow_by(tolerance)
  }

  override interactive_hit(sx: number, sy: number): boolean {
    if (!this.model.visible) {
      return false
    }
    const bbox = this.interactive_bbox()
    return bbox.contains(sx, sy)
  }

  private _hit_test(sx: number, sy: number): Box.HitTarget | null {
    const {left, right, bottom, top} = this.bbox
    const tolerance = Math.max(EDGE_TOLERANCE, this.model.line_width/2)

    const dl = abs(left - sx)
    const dr = abs(right - sx)
    const dt = abs(top - sy)
    const db = abs(bottom - sy)

    const hits = {
      left:   dl < tolerance && dl < dr,
      right:  dr < tolerance && dr < dl,
      top:    dt < tolerance && dt < db,
      bottom: db < tolerance && db < dt,
    }

    const hittable = this._hittable()

    const hits_handle = (hit_target: Box.HitTarget, condition: boolean): boolean => {
      if (!hittable[hit_target]) {
        return false
      }
      const handle = this._handles_views[hit_target]
      if (handle != null) {
        return handle.bbox.contains(sx, sy)
      } else {
        return condition
      }
    }

    if (hits_handle("top_left", hits.top && hits.left)) {
      return "top_left"
    }
    if (hits_handle("top_right", hits.top && hits.right)) {
      return "top_right"
    }
    if (hits_handle("bottom_left", hits.bottom && hits.left)) {
      return "bottom_left"
    }
    if (hits_handle("bottom_right", hits.bottom && hits.right)) {
      return "bottom_right"
    }

    if (hits_handle("left", hits.left)) {
      return "left"
    }
    if (hits_handle("right", hits.right)) {
      return "right"
    }
    if (hits_handle("top", hits.top)) {
      return "top"
    }
    if (hits_handle("bottom", hits.bottom)) {
      return "bottom"
    }

    if (hits_handle("area", this.bbox.contains(sx, sy))) {
      return "area"
    }

    return null
  }

  get resizable(): LRTB<boolean> & Corners<boolean> {
    const {resizable} = this.model
    const left = resizable == "left" || resizable == "x" || resizable == "all"
    const right = resizable == "right" || resizable == "x" || resizable == "all"
    const top = resizable == "top" || resizable == "y" || resizable == "all"
    const bottom = resizable == "bottom" || resizable == "y" || resizable == "all"
    return {
      left,
      right,
      top,
      bottom,
      top_left:     top    && left,
      top_right:    top    && right,
      bottom_left:  bottom && left,
      bottom_right: bottom && right,
    }
  }

  get movable(): boolean {
    return this.model.movable != "none"
  }

  private _hittable(): {[key in Box.HitTarget]: boolean} {
    const {left, right, top, bottom} = this.resizable
    return {
      top_left:     top && left,
      top_right:    top && right,
      bottom_left:  bottom && left,
      bottom_right: bottom && right,
      left,
      right,
      top,
      bottom,
      area: this.movable,
    }
  }

  private _can_hit(target: Box.HitTarget): boolean {
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
      case "area":         return this.movable
    }
  }

  private _pan_state: {bbox: BBox, target: Box.HitTarget} | null = null

  on_pan_start(ev: PanEvent): boolean {
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

  on_pan(ev: PanEvent): void {
    assert(this._pan_state != null)

    const {mappers} = this

    const resolve = (dim: "x" | "y", limit: Coordinate | number | null, mapper: CoordinateMapper): number => {
      if (limit instanceof Coordinate) {
        return this.resolve_as_scalar(limit, dim)
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

      const Dx = min(Dl < 0 ? Dl : NaN, Dr < 0 ? Dr : NaN)
      if (isFinite(Dx) && Dx < 0) {
        left += -left_sign*(-Dx)
        right += -right_sign*(-Dx)
      }

      const Dt = top - slimits.top
      const Db = slimits.bottom - bottom

      const Dy = min(Dt < 0 ? Dt : NaN, Db < 0 ? Db : NaN)
      if (isFinite(Dy) && Dy < 0) {
        top += -top_sign*(-Dy)
        bottom += -bottom_sign*(-Dy)
      }

      return BBox.from_lrtb({left, right, top, bottom})
    })()

    const {min_width, min_height, max_width, max_height} = this.model
    const {left, right, top, bottom} = this.model

    const lrtb = {
      left:   mappers.left.invert(slrtb.left),
      right:  mappers.right.invert(slrtb.right),
      top:    mappers.top.invert(slrtb.top),
      bottom: mappers.bottom.invert(slrtb.bottom),
    }

    if (0 < min_width || max_width < Infinity) {
      if (dl != 0 && dr == 0) {
        const min_left = lrtb.right - max_width
        const max_left = lrtb.right - min_width
        lrtb.left = clamp(lrtb.left, min_left, max_left)
      } else if (dl == 0 && dr != 0) {
        const min_right = lrtb.left + min_width
        const max_right = lrtb.left + max_width
        lrtb.right = clamp(lrtb.right, min_right, max_right)
      }
    }

    if (0 < min_height || max_height < Infinity) {
      if (dt != 0 && db == 0) {
        const min_top = lrtb.bottom + max_height
        const max_top = lrtb.bottom + min_height
        lrtb.top = clamp(lrtb.top, min_top, max_top)
      } else if (dt == 0 && db != 0) {
        const min_bottom = lrtb.top - min_height
        const max_bottom = lrtb.top - max_height
        lrtb.bottom = clamp(lrtb.bottom, min_bottom, max_bottom)
      }
    }

    const computed_lrtb = (() => {
      return {
        left:   left   instanceof Coordinate ? left   : lrtb.left,
        right:  right  instanceof Coordinate ? right  : lrtb.right,
        top:    top    instanceof Coordinate ? top    : lrtb.top,
        bottom: bottom instanceof Coordinate ? bottom : lrtb.bottom,
      }
    })()

    this.model.update(computed_lrtb)
    this.model.pan.emit(["pan", ev.modifiers])
  }

  on_pan_end(ev: PanEvent): void {
    this._pan_state = null
    this.model.pan.emit(["pan:end", ev.modifiers])
  }

  private _pinch_state: {bbox: BBox} | null = null

  on_pinch_start(ev: PinchEvent): boolean {
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

  on_pinch(ev: PinchEvent): void {
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
        left:   left   instanceof Coordinate ? left   : mappers.left.invert(slrtb.left),
        right:  right  instanceof Coordinate ? right  : mappers.right.invert(slrtb.right),
        top:    top    instanceof Coordinate ? top    : mappers.top.invert(slrtb.top),
        bottom: bottom instanceof Coordinate ? bottom : mappers.bottom.invert(slrtb.bottom),
      }
    })()

    this.model.update(lrtb)
    this.model.pan.emit(["pan", ev.modifiers])
  }

  on_pinch_end(ev: PinchEvent): void {
    this._pinch_state = null
    this.model.pan.emit(["pan:end", ev.modifiers])
  }

  private get _has_hover(): boolean {
    const {hover_line, hover_fill, hover_hatch} = this.visuals
    return hover_line.doit || hover_fill.doit || hover_hatch.doit
  }

  private _is_hovered: boolean = false

  on_enter(_ev: MoveEvent): boolean {
    const {_has_hover} = this
    if (_has_hover) {
      this._is_hovered = true
      this.request_paint()
    }
    return _has_hover
  }

  on_move(_ev: MoveEvent): void {}

  on_leave(_ev: MoveEvent): void {
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

    const {
      tl_cursor, tr_cursor, bl_cursor, br_cursor,
      ew_cursor, ns_cursor,
      in_cursor,
    } = this.model

    switch (target) {
      case "top_left":     return this._handles.top_left == null     ? tl_cursor : null
      case "top_right":    return this._handles.top_right == null    ? tr_cursor : null
      case "bottom_left":  return this._handles.bottom_left == null  ? bl_cursor : null
      case "bottom_right": return this._handles.bottom_right == null ? br_cursor : null
      case "left":         return this._handles.left == null         ? ew_cursor : null
      case "right":        return this._handles.right == null        ? ew_cursor : null
      case "top":          return this._handles.top == null          ? ns_cursor : null
      case "bottom":       return this._handles.bottom == null       ? ns_cursor : null
      case "area": {
        if (this._handles.area == null) {
          switch (this.model.movable) {
            case "both": return in_cursor
            case "x":    return ew_cursor
            case "y":    return ns_cursor
            case "none": return null
          }
        } else {
          return null
        }
      }
    }
  }
}

export namespace BoxAnnotation {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    top: p.Property<number | Coordinate>
    bottom: p.Property<number | Coordinate>
    left: p.Property<number | Coordinate>
    right: p.Property<number | Coordinate>

    top_units: p.Property<CoordinateUnits>
    bottom_units: p.Property<CoordinateUnits>
    left_units: p.Property<CoordinateUnits>
    right_units: p.Property<CoordinateUnits>

    top_limit: p.Property<Box.Limit>
    bottom_limit: p.Property<Box.Limit>
    left_limit: p.Property<Box.Limit>
    right_limit: p.Property<Box.Limit>

    min_width: p.Property<number>
    min_height: p.Property<number>
    max_width: p.Property<number>
    max_height: p.Property<number>

    border_radius: p.Property<BorderRadius>

    editable: p.Property<boolean>
    resizable: p.Property<Box.Resizable>
    movable: p.Property<Box.Movable>
    symmetric: p.Property<boolean>

    use_handles: p.Property<boolean>
    handles: p.Property<BoxInteractionHandles>

    inverted: p.Property<boolean>

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

  override clone(attrs?: Partial<BoxAnnotation.Attrs>): this {
    return super.clone(attrs)
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

    this.define<BoxAnnotation.Props>(({Bool, Float, Ref, Or, NonNegative, Positive}) => ({
      top:          [ Or(Float, Ref(Coordinate)), () => new Node({target: "frame", symbol: "top"}) ],
      bottom:       [ Or(Float, Ref(Coordinate)), () => new Node({target: "frame", symbol: "bottom"}) ],
      left:         [ Or(Float, Ref(Coordinate)), () => new Node({target: "frame", symbol: "left"}) ],
      right:        [ Or(Float, Ref(Coordinate)), () => new Node({target: "frame", symbol: "right"}) ],

      top_units:    [ CoordinateUnits, "data" ],
      bottom_units: [ CoordinateUnits, "data" ],
      left_units:   [ CoordinateUnits, "data" ],
      right_units:  [ CoordinateUnits, "data" ],

      top_limit:    [ Box.Limit, null ],
      bottom_limit: [ Box.Limit, null ],
      left_limit:   [ Box.Limit, null ],
      right_limit:  [ Box.Limit, null ],

      min_width:    [ NonNegative(Float), 0 ],
      min_height:   [ NonNegative(Float), 0 ],
      max_width:    [ Positive(Float), Infinity ],
      max_height:   [ Positive(Float), Infinity ],

      border_radius: [ BorderRadius, 0 ],

      editable:     [ Bool, false ],
      resizable:    [ Box.Resizable, "all" ],
      movable:      [ Box.Movable, "both" ],
      symmetric:    [ Bool, false ],

      use_handles:  [ Bool, false ],
      handles:      [ Ref(BoxInteractionHandles), DEFAULT_HANDLES ],

      inverted:     [ Bool, false ],
    }))

    this.internal<BoxAnnotation.Props>(({Str}) => ({
      tl_cursor: [ Str, "nwse-resize" ],
      tr_cursor: [ Str, "nesw-resize" ],
      bl_cursor: [ Str, "nesw-resize" ],
      br_cursor: [ Str, "nwse-resize" ],
      ew_cursor: [ Str, "ew-resize" ],
      ns_cursor: [ Str, "ns-resize" ],
      in_cursor: [ Str, "move" ],
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

  update({left, right, top, bottom}: LRTB<number | Coordinate>): void {
    this.setv({left, right, top, bottom, visible: true})
  }

  clear(): void {
    this.visible = false
  }

  readonly nodes = (() => {
    const known = new Map<string, Node>()
    const node = (symbol: string) => {
      let node = known.get(symbol)
      if (node === undefined) {
        known.set(symbol, node = new Node({target: this, symbol}))
      }
      return node
    }
    return {
      get left(): Node          { return node("left") },
      get right(): Node         { return node("right") },
      get top(): Node           { return node("top") },
      get bottom(): Node        { return node("bottom") },
      get top_left(): Node      { return node("top_left") },
      get top_center(): Node    { return node("top_center") },
      get top_right(): Node     { return node("top_right") },
      get center_left(): Node   { return node("center_left") },
      get center(): Node        { return node("center") },
      get center_right(): Node  { return node("center_right") },
      get bottom_left(): Node   { return node("bottom_left") },
      get bottom_center(): Node { return node("bottom_center") },
      get bottom_right(): Node  { return node("bottom_right") },
      get width(): Node         { return node("width") },
      get height(): Node        { return node("height") },
    }
  })()
}
