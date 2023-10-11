import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {compute_angle, invert_angle, atan2} from "core/util/math"
import type {CoordinateMapper} from "core/util/bbox"
import {CoordinateUnits, AngleUnits, Direction} from "core/enums"
import type {Size} from "core/layout"
import {SideLayout} from "core/layout/side_panel"
import type * as p from "core/properties"
import type {GraphicsBox} from "core/graphics"
import {assert} from "core/util/assert"
import type {Pannable, PanEvent, KeyModifiers} from "core/ui_events"
import {Signal} from "core/signaling"
import {rotate_around} from "core/util/affine"
import type {LRTB, XY, Corners} from "core/util/bbox"
import {BBox} from "core/util/bbox"
import {TextAnchor, Padding, BorderRadius} from "../common/kinds"
import * as resolve from "../common/resolve"
import {round_rect} from "../common/painting"
import {Node} from "../coordinates/node"

type HitTarget = "area"
type SXY = {sx: number, sy: number}

function xy<T>(x: T, y: T): XY<T> {
  return {x, y}
}

export class LabelView extends TextAnnotationView implements Pannable {
  declare model: Label
  declare visuals: Label.Visuals

  override update_layout(): void {
    const {panel} = this
    if (panel != null)
      this.layout = new SideLayout(panel, () => this.get_size(), false)
    else
      this.layout = undefined
  }

  protected override _get_size(): Size {
    if (!this.displayed) {
      return {width: 0, height: 0}
    }

    const graphics = this._text_view.graphics()
    graphics.angle = this.angle
    graphics.align = "auto"
    graphics.visuals = this.visuals.text.values()

    const {width, height} = graphics.size()
    return {width, height}
  }

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

  get padding(): LRTB<number> {
    return resolve.padding(this.model.padding)
  }

  get border_radius(): Corners<number> {
    return resolve.border_radius(this.model.border_radius)
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

  protected _text_box: GraphicsBox
  protected _rect: {
    sx: number
    sy: number
    width: number
    height: number
    angle: number
    anchor: XY<number>
    padding: LRTB<number>
    border_radius: Corners<number>
  }

  override compute_geometry(): void {
    super.compute_geometry()

    const text_box = this._text_view.graphics()
    text_box.position = {sx: 0, sy: 0, x_anchor: "left", y_anchor: "top"}
    text_box.angle = 0 // needs reset because text_box is self-referential
    text_box.align = "auto"
    text_box.visuals = this.visuals.text.values()

    const size = text_box.size()
    const {sx, sy} = this.origin
    const {anchor, padding, border_radius, angle} = this

    const width = size.width + padding.left + padding.right
    const height = size.height + padding.top + padding.bottom

    this._text_box = text_box
    this._rect = {sx, sy, width, height, angle, anchor, padding, border_radius}
  }

  protected _render(): void {
    this.compute_geometry() // TODO: remove this

    const {ctx} = this.layer

    const {sx, sy, width, height, angle, anchor, padding, border_radius} = this._rect
    const label = this._text_box

    const dx = anchor.x*width
    const dy = anchor.y*height

    ctx.translate(sx, sy)
    ctx.rotate(angle)
    ctx.translate(-dx, -dy)

    const {background_fill, background_hatch, border_line, text} = this.visuals
    if (background_fill.doit || background_hatch.doit || border_line.doit) {
      ctx.beginPath()
      const bbox = new BBox({x: 0, y: 0, width, height})
      round_rect(ctx, bbox, border_radius)
      background_fill.apply(ctx)
      background_hatch.apply(ctx)
      border_line.apply(ctx)
    }

    if (text.doit) {
      const {left, top} = padding
      ctx.translate(left, top)
      label.paint(ctx)
      ctx.translate(-left, -top)
    }

    ctx.translate(dx, dy)
    ctx.rotate(-angle)
    ctx.translate(-sx, -sy)
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
    padding: p.Property<Padding>
    border_radius: p.Property<BorderRadius>
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
      padding:     [ Padding, 0 ],
      border_radius: [ BorderRadius, 0 ],
      editable:    [ Boolean, false ],
    }))
  }

  readonly pan = new Signal<["pan:start" | "pan" | "pan:end", KeyModifiers], this>(this, "pan")
}
