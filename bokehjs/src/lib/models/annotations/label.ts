import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {compute_angle, invert_angle, atan2} from "core/util/math"
import type {CoordinateMapper} from "core/util/bbox"
import {CoordinateUnits, AngleUnits, Direction} from "core/enums"
import type * as p from "core/properties"
import {assert} from "core/util/assert"
import type {Pannable, PanEvent, KeyModifiers} from "core/ui_events"
import {Signal} from "core/signaling"
import {rotate_around} from "core/util/affine"
import type {XY, SXY} from "core/util/bbox"
import {TextAnchor} from "../common/kinds"
import * as resolve from "../common/resolve"
import {Node} from "../coordinates/node"

type HitTarget = "area"

function xy<T>(x: T, y: T): XY<T> {
  return {x, y}
}

export class LabelView extends TextAnnotationView implements Pannable {
  declare model: Label
  declare visuals: Label.Visuals

  get mappers(): XY<CoordinateMapper> {
    function mapper(units: CoordinateUnits, scale: CoordinateMapper, view: CoordinateMapper, canvas: CoordinateMapper) {
      switch (units) {
        case "canvas": return canvas
        case "screen": return view
        case "data":   return scale
      }
    }

    const overlay = this.model
    const parent = this.layout ?? this.plot_view.frame
    const {x_scale, y_scale} = this.coordinates
    const {x_view, y_view} = parent.bbox
    const {x_screen, y_screen} = this.plot_view.canvas.bbox

    const xy = {
      x: mapper(overlay.x_units, x_scale, x_view, x_screen),
      y: mapper(overlay.y_units, y_scale, y_view, y_screen),
    }

    return xy
  }

  get anchor(): XY<number> {
    const {align, baseline} = this.visuals.text.values()
    return resolve.text_anchor(this.model.anchor, align, baseline)
  }

  get angle(): number {
    const {angle, angle_units, direction} = this.model
    return compute_angle(angle, angle_units, direction)
  }

  get origin(): SXY {
    const {mappers} = this
    const {x, y, x_offset, y_offset} = this.model

    const compute = (dim: "x" | "y", value: number | Node, mapper: CoordinateMapper): number => {
      return value instanceof Node ? this.resolve_node(value)[dim] : mapper.compute(value)
    }

    const sx = compute("x", x, mappers.x) + x_offset
    const sy = compute("y", y, mappers.y) - y_offset // TODO this needs to be unified with the rest of bokehjs

    return {sx, sy}
  }

  override interactive_hit(sx: number, sy: number): boolean {
    if (!this.model.visible || !this.model.editable)
      return false
    return this._hit_test(sx, sy) == "area"
  }

  protected _hit_test(cx: number, cy: number): HitTarget | null {
    const {sx, sy, anchor, angle, width, height} = this._rect

    const {x, y} = rotate_around(xy(cx, cy), xy(sx, sy), -angle)

    const left = sx - anchor.x*width
    const top = sy - anchor.y*height
    const right = left + width
    const bottom = top + height

    if (left <= x && x <= right && top <= y && y <= bottom)
      return "area"
    else
      return null
  }

  private _can_hit(_target: HitTarget): boolean {
    return true
  }

  private _pan_state: {angle: number, base: SXY, target: HitTarget, action: "rotate"} | null = null

  _pan_start(ev: PanEvent): boolean {
    if (this.model.visible && this.model.editable) {
      const {sx, sy} = ev
      const target = this._hit_test(sx, sy)
      if (target != null && this._can_hit(target)) {
        this._pan_state = {
          angle: this.angle,
          base: {sx, sy},
          target,
          action: "rotate",
        }
        this.model.pan.emit(["pan:start", ev.modifiers])
        return true
      }
    }
    return false
  }

  _pan(ev: PanEvent): void {
    assert(this._pan_state != null)

    const {dx, dy} = ev
    const {angle, base} = this._pan_state
    const {origin} = this

    const angle0 = atan2([origin.sx, origin.sy], [base.sx, base.sy])
    const angle1 = atan2([origin.sx, origin.sy], [base.sx + dx, base.sy + dy])

    const da = angle1 - angle0
    const na = angle + da

    const nna = na % (2*Math.PI)

    const {angle_units, direction} = this.model
    this.model.angle = invert_angle(nna, angle_units, direction)

    this.model.pan.emit(["pan", ev.modifiers])
  }

  _pan_end(ev: PanEvent): void {
    this._pan_state = null
    this.model.pan.emit(["pan:end", ev.modifiers])
  }

  override cursor(sx: number, sy: number): string | null {
    const target = this._pan_state?.target ?? this._hit_test(sx, sy)
    if (target == null || !this._can_hit(target)) {
      return null
    }
    return "var(--bokeh-cursor-rotate)"
  }
}

export namespace Label {
  export type Props = TextAnnotation.Props & {
    anchor: p.Property<TextAnchor>
    x: p.Property<number | Node>
    y: p.Property<number | Node>
    x_units: p.Property<CoordinateUnits>
    y_units: p.Property<CoordinateUnits>
    x_offset: p.Property<number>
    y_offset: p.Property<number>
    angle: p.Property<number>
    angle_units: p.Property<AngleUnits>
    direction: p.Property<Direction>
    editable: p.Property<boolean>
  }

  export type Attrs = p.AttrsOf<Props>

  export type Visuals = TextAnnotation.Visuals
}

export interface Label extends Label.Attrs {}

export class Label extends TextAnnotation {
  declare properties: Label.Props
  declare __view_type__: LabelView

  constructor(attrs?: Partial<Label.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LabelView

    this.define<Label.Props>(({Boolean, Number, Angle, Or, Ref}) => ({
      anchor:      [ TextAnchor, "auto" ],
      x:           [ Or(Number, Ref(Node)) ],
      y:           [ Or(Number, Ref(Node)) ],
      x_units:     [ CoordinateUnits, "data" ],
      y_units:     [ CoordinateUnits, "data" ],
      x_offset:    [ Number, 0 ],
      y_offset:    [ Number, 0 ],
      angle:       [ Angle, 0 ],
      angle_units: [ AngleUnits, "rad" ],
      direction:   [ Direction, "anticlock" ],
      editable:    [ Boolean, false ],
    }))
  }

  readonly pan = new Signal<["pan:start" | "pan" | "pan:end", KeyModifiers], this>(this, "pan")
}
