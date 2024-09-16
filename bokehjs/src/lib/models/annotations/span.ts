import {Annotation, AnnotationView} from "./annotation"
import type {Scale} from "../scales/scale"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import {CoordinateUnits, Dimension} from "core/enums"
import type {PanEvent, Pannable, MoveEvent, Moveable, KeyModifiers} from "core/ui_events"
import {dist_to_segment} from "core/hittest"
import {Signal} from "core/signaling"
import type * as p from "core/properties"
import type {CoordinateMapper} from "core/util/bbox"
import {assert} from "core/util/assert"
import type {Context2d} from "core/util/canvas"

const EDGE_TOLERANCE = 2.5

type HitTarget = "edge"

type Point = {x: number, y: number}

class Line {
  constructor(readonly p0: Point, readonly p1: Point) {}

  clone(): Line {
    return new Line({...this.p0}, {...this.p1})
  }

  hit_test(pt: Point, tolerance: number = EDGE_TOLERANCE): boolean {
    return dist_to_segment(pt, this.p0, this.p1) < tolerance
  }

  translate(dx: number, dy: number): Line {
    const {p0, p1} = this
    const dp0 = {x: p0.x + dx, y: p0.y + dy}
    const dp1 = {x: p1.x + dx, y: p1.y + dy}
    return new Line(dp0, dp1)
  }
}

export class SpanView extends AnnotationView implements Pannable, Moveable /*, AutoRanged*/ {
  declare model: Span
  declare visuals: Span.Visuals

  protected line: Line

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.plot_view.request_paint(this))
  }

  protected _paint(ctx: Context2d): void {
    const {location, location_units} = this.model
    if (location == null) {
      return
    }

    function compute(value: number, units: CoordinateUnits, scale: Scale,
        view: CoordinateMapper, canvas: CoordinateMapper): number {
      switch (units) {
        case "canvas": return canvas.compute(value)
        case "screen": return view.compute(value)
        case "data":   return scale.compute(value)
      }
    }

    const {frame, canvas} = this.plot_view
    const {x_scale, y_scale} = this.coordinates

    let height: number, sleft: number, stop: number, width: number
    if (this.model.dimension == "width") {
      stop = compute(location, location_units, y_scale, frame.bbox.yview, canvas.bbox.y_screen)
      sleft = frame.bbox.left
      width = frame.bbox.width
      height = this.model.line_width
    } else {
      stop = frame.bbox.top
      sleft = compute(location, location_units, x_scale, frame.bbox.xview, canvas.bbox.y_screen)
      width = this.model.line_width
      height = frame.bbox.height
    }

    const p0 = {x: sleft, y: stop}
    const p1 = {x: sleft + width, y: stop + height}
    this.line = new Line(p0, p1)

    const {_is_hovered, visuals} = this
    const line = _is_hovered && visuals.hover_line.doit ? visuals.hover_line : visuals.line

    ctx.save()

    ctx.beginPath()
    this.visuals.line.set_value(ctx)
    ctx.moveTo(sleft, stop)
    if (this.model.dimension == "width") {
      ctx.lineTo(sleft + width, stop)
    } else {
      ctx.lineTo(sleft, stop + height)
    }
    line.apply(ctx)

    ctx.restore()
  }

  override interactive_hit(sx: number, sy: number): boolean {
    if (!this.model.visible || !this.model.editable) {
      return false
    }
    return this._hit_test(sx, sy) != null
  }

  private _hit_test(sx: number, sy: number): HitTarget | null {
    const tolerance = Math.max(EDGE_TOLERANCE, this.model.line_width/2)
    return this.line.hit_test({x: sx, y: sy}, tolerance) ? "edge" : null
  }

  private _can_hit(_target: HitTarget): boolean {
    return true
  }

  private _pan_state: {line: Line, target: HitTarget} | null = null

  on_pan_start(ev: PanEvent): boolean {
    if (this.model.visible && this.model.editable) {
      const {sx, sy} = ev
      const target = this._hit_test(sx, sy)
      if (target != null && this._can_hit(target)) {
        this._pan_state = {
          line: this.line.clone(),
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

    function invert(sv: number, units: CoordinateUnits, scale: Scale,
        view: CoordinateMapper, canvas: CoordinateMapper): number {
      switch (units) {
        case "canvas": return canvas.invert(sv)
        case "screen": return view.invert(sv)
        case "data":   return scale.invert(sv)
      }
    }

    const sloc = (() => {
      const {dx, dy} = ev
      const {line} = this._pan_state

      if (this.model.dimension == "width") {
        return line.translate(0, dy).p0.y
      } else {
        return line.translate(dx, 0).p0.x
      }
    })()

    const loc = (() => {
      const {location_units} = this.model
      const {frame, canvas} = this.plot_view
      const {x_scale, y_scale} = this.coordinates

      if (this.model.dimension == "width") {
        return invert(sloc, location_units, y_scale, frame.bbox.yview, canvas.bbox.y_screen)
      } else {
        return invert(sloc, location_units, x_scale, frame.bbox.xview, canvas.bbox.y_screen)
      }
    })()

    this.model.location = loc
    this.model.pan.emit(["pan", ev.modifiers])
  }

  on_pan_end(ev: PanEvent): void {
    this._pan_state = null
    this.model.pan.emit(["pan:end", ev.modifiers])
  }

  private get _has_hover(): boolean {
    const {hover_line} = this.visuals
    return hover_line.doit
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
    return this.model.dimension == "width" ? "ns-resize" : "ew-resize"
  }
}

export namespace Span {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    location: p.Property<number | null>
    location_units: p.Property<CoordinateUnits>
    dimension: p.Property<Dimension>
    editable: p.Property<boolean>
  } & Mixins

  export type Mixins =
    mixins.Line &
    mixins.HoverLine

  export type Visuals = Annotation.Visuals & {
    line: visuals.Line
    hover_line: visuals.Line
  }
}

export interface Span extends Span.Attrs {}

export class Span extends Annotation {
  declare properties: Span.Props
  declare __view_type__: SpanView

  constructor(attrs?: Partial<Span.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SpanView

    this.mixins<Span.Mixins>([
      mixins.Line,
      ["hover_", mixins.Line],
    ])

    this.define<Span.Props>(({Bool, Float, Nullable}) => ({
      location:       [ Nullable(Float), null ],
      location_units: [ CoordinateUnits, "data" ],
      dimension:      [ Dimension, "width" ],
      editable:       [ Bool, false ],
    }))

    this.override<Span.Props>({
      line_color: "black",
      hover_line_color: null,
      hover_line_alpha: 0.3,
    })
  }

  readonly pan = new Signal<["pan:start" | "pan" | "pan:end", KeyModifiers], this>(this, "pan")
}
