import {Annotation, AnnotationView} from "./annotation"
import {Scale} from "../scales/scale"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import {SpatialUnits} from "core/enums"
import {PanEvent, Pannable} from "core/ui_events"
import {Signal} from "core/signaling"
import * as p from "core/properties"
import {assert} from "core/util/assert"
import {BBox, CoordinateMapper} from "core/util/bbox"

export const EDGE_TOLERANCE = 2.5

const {abs} = Math

type Corner = "top_left" | "top_right" | "bottom_left" | "bottom_right"
type Edge = "left" | "right" | "top" | "bottom"
type HitTarget = Corner | Edge | "box"

export class BoxAnnotationView extends AnnotationView implements Pannable {
  override model: BoxAnnotation
  override visuals: BoxAnnotation.Visuals

  protected bbox: BBox = new BBox()

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_render())
  }

  protected _render(): void {
    const {left, right, top, bottom} = this.model

    // don't render if *all* position are null
    if (left == null && right == null && top == null && bottom == null) {
      this.bbox = new BBox()
      return
    }

    const {frame} = this.plot_view
    const xscale = this.coordinates.x_scale
    const yscale = this.coordinates.y_scale

    const _calc_dim = (dim: number | null, dim_units: SpatialUnits, scale: Scale, view: CoordinateMapper, frame_extrema: number): number => {
      let sdim
      if (dim != null) {
        if (this.model.screen)
          sdim = dim
        else {
          if (dim_units == "data")
            sdim = scale.compute(dim)
          else
            sdim = view.compute(dim)
        }
      } else
        sdim = frame_extrema
      return sdim
    }

    this.bbox = BBox.from_rect({
      left:   _calc_dim(left,   this.model.left_units,   xscale, frame.bbox.xview, frame.bbox.left),
      right:  _calc_dim(right,  this.model.right_units,  xscale, frame.bbox.xview, frame.bbox.right),
      top:    _calc_dim(top,    this.model.top_units,    yscale, frame.bbox.yview, frame.bbox.top),
      bottom: _calc_dim(bottom, this.model.bottom_units, yscale, frame.bbox.yview, frame.bbox.bottom),
    })

    this._paint_box()
  }

  protected _paint_box(): void {
    const {ctx} = this.layer
    ctx.save()

    const {left, top, width, height} = this.bbox
    ctx.beginPath()
    ctx.rect(left, top, width, height)

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)

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

    // consider null as non-editable
    const hits_left = abs(left - sx) < EDGE_TOLERANCE
    const hits_right = abs(right - sx) < EDGE_TOLERANCE
    const hits_top = abs(top - sy) < EDGE_TOLERANCE
    const hits_bottom = abs(bottom - sy) < EDGE_TOLERANCE

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

  _pan_start(ev: PanEvent): boolean {
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

  _pan(ev: PanEvent): void {
    assert(this.model.screen && this._pan_state != null)

    const dx = ev.deltaX
    const dy = ev.deltaY

    const {bbox, target} = this._pan_state
    const {left, top, right, bottom} = bbox

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
        case "box":
          return {left: left + dx, top: top + dy, right: right + dx, bottom: bottom + dy}
      }
    })()

    this.model.update(ltrb)
    this.model.pan.emit("pan")
  }

  _pan_end(_ev: PanEvent): void {
    this._pan_state = null
    this.model.pan.emit("pan:end")
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
    top_units: p.Property<SpatialUnits>
    bottom: p.Property<number | null>
    bottom_units: p.Property<SpatialUnits>
    left: p.Property<number | null>
    left_units: p.Property<SpatialUnits>
    right: p.Property<number | null>
    right_units: p.Property<SpatialUnits>
    screen: p.Property<boolean>
    editable: p.Property<boolean>
    tl_cursor: p.Property<string>
    tr_cursor: p.Property<string>
    bl_cursor: p.Property<string>
    br_cursor: p.Property<string>
    ew_cursor: p.Property<string>
    ns_cursor: p.Property<string>
    in_cursor: p.Property<string>
  } & Mixins

  export type Mixins = mixins.Line & mixins.Fill & mixins.Hatch

  export type Visuals = Annotation.Visuals & {line: visuals.Line, fill: visuals.Fill, hatch: visuals.Hatch}
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

    this.mixins<BoxAnnotation.Mixins>([mixins.Line, mixins.Fill, mixins.Hatch])

    this.define<BoxAnnotation.Props>(({Boolean, Number, Nullable}) => ({
      top:          [ Nullable(Number), null ],
      top_units:    [ SpatialUnits, "data" ],
      bottom:       [ Nullable(Number), null ],
      bottom_units: [ SpatialUnits, "data" ],
      left:         [ Nullable(Number), null ],
      left_units:   [ SpatialUnits, "data" ],
      right:        [ Nullable(Number), null ],
      right_units:  [ SpatialUnits, "data" ],
      editable:     [ Boolean, false ],
    }))

    this.internal<BoxAnnotation.Props>(({Boolean, String}) => ({
      screen:    [ Boolean, false ],
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
    })
  }

  readonly pan = new Signal<"pan:start" | "pan" | "pan:end", this>(this, "pan")

  update({left, right, top, bottom}: {left: number | null, right: number | null, top: number | null, bottom: number | null}): void {
    this.setv({left, right, top, bottom, visible: true, screen: true})
  }

  clear(): void {
    this.visible = false
  }
}
