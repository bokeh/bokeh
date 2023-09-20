import {Annotation, AnnotationView} from "./annotation"
import type {Scale} from "../scales/scale"
import type {AutoRanged} from "../ranges/auto_ranged"
import {auto_ranged} from "../ranges/auto_ranged"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import {CoordinateUnits} from "core/enums"
import type {Arrayable, Rect} from "core/types"
import {point_in_poly, dist_to_segment} from "core/hittest"
import {Signal} from "core/signaling"
import type {PanEvent, Pannable, MoveEvent, Moveable, KeyModifiers} from "core/ui_events"
import type {CoordinateMapper} from "core/util/bbox"
import {BBox, empty} from "core/util/bbox"
import {minmax2} from "core/util/arrayable"
import {assert} from "core/util/assert"
import type * as p from "core/properties"

export type Node = {
  type: "node"
  i: number
}

export type Edge = {
  type: "edge"
  i: number
}

export type Area = {
  type: "area"
}

export type HitTarget = Node | Edge | Area

type Point = {x: number, y: number}

class Polygon {
  constructor(readonly xs: Arrayable<number> = [], readonly ys: Arrayable<number> = []) {
    assert(xs.length == ys.length)
  }

  clone(): Polygon {
    return new Polygon(this.xs.slice(), this.ys.slice())
  }

  public [Symbol.iterator](): Iterator<[number, number, number]> {
    return this.nodes()
  }

  public *nodes(): IterableIterator<[number, number, number]> {
    const {xs, ys, n} = this
    for (let i = 0; i < n; i++) {
      yield [xs[i], ys[i], i]
    }
  }

  public *edges(): IterableIterator<[Point, Point, number]> {
    const {xs, ys, n} = this
    for (let i = 1; i < n; i++) {
      const p0 = {x: xs[i-1], y: ys[i-1]}
      const p1 = {x: xs[i], y: ys[i]}
      yield [p0, p1, i - 1]
    }
    if (n >= 3) {
      const p0 = {x: xs[n-1], y: ys[n-1]}
      const p1 = {x: xs[0], y: ys[0]}
      yield [p0, p1, n - 1]
    }
  }

  contains(x: number, y: number): boolean {
    return point_in_poly(x, y, this.xs, this.ys)
  }

  get bbox(): BBox {
    const [x0, x1, y0, y1] = minmax2(this.xs, this.ys)
    return new BBox({x0, x1, y0, y1})
  }

  get n(): number {
    return this.xs.length
  }

  translate(dx: number, dy: number, ...i: number[]): Polygon {
    const poly = this.clone()
    const {xs, ys, n} = poly
    if (i.length != 0) {
      for (const j of i) {
        const k = j % n
        xs[k] += dx
        ys[k] += dy
      }
    } else {
      for (let i = 0; i < n; i++) {
        xs[i] += dx
        ys[i] += dy
      }
    }
    return poly
  }
}

export class PolyAnnotationView extends AnnotationView implements Pannable, Moveable, AutoRanged {
  declare model: PolyAnnotation
  declare visuals: PolyAnnotation.Visuals

  protected poly: Polygon = new Polygon()

  override get bbox(): BBox {
    return this.poly.bbox
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_paint())
  }

  readonly [auto_ranged] = true

  bounds(): Rect {
    const {xs_units, ys_units} = this.model
    if (xs_units == "data" && ys_units == "data") {
      const {xs, ys} = this.model
      const [x0, x1, y0, y1] = minmax2(xs, ys)
      return {x0, x1, y0, y1}
    } else {
      return empty()
    }
  }

  protected _mappers(): {x: CoordinateMapper, y: CoordinateMapper} {
    const mapper = (units: CoordinateUnits, scale: Scale,
        view: CoordinateMapper, canvas: CoordinateMapper): CoordinateMapper => {
      switch (units) {
        case "canvas": return canvas
        case "screen": return view
        case "data":   return scale
      }
    }

    const overlay = this.model
    const {frame, canvas} = this.plot_view
    const {x_scale, y_scale} = frame
    const {x_view, y_view} = frame.bbox
    const {x_screen, y_screen} = canvas.bbox

    return {
      x: mapper(overlay.xs_units, x_scale, x_view, x_screen),
      y: mapper(overlay.ys_units, y_scale, y_view, y_screen),
    }
  }

  protected _paint(): void {
    const {xs, ys} = this.model
    assert(xs.length == ys.length)

    this.poly = (() => {
      const {x, y} = this._mappers()
      return new Polygon(x.v_compute(xs), y.v_compute(ys))
    })()

    const {ctx} = this.layer
    ctx.beginPath()
    for (const [sx, sy] of this.poly) {
      ctx.lineTo(sx, sy)
    }

    const {_is_hovered, visuals} = this
    const fill = _is_hovered && visuals.hover_fill.doit ? visuals.hover_fill : visuals.fill
    const hatch = _is_hovered && visuals.hover_hatch.doit ? visuals.hover_hatch : visuals.hatch
    const line = _is_hovered && visuals.hover_line.doit ? visuals.hover_line : visuals.line

    if (this.poly.n >= 3) {
      ctx.closePath()
      fill.apply(ctx)
      hatch.apply(ctx)
    }

    line.apply(ctx)
  }

  override interactive_hit(sx: number, sy: number): boolean {
    if (!this.model.visible || !this.model.editable) {
      return false
    }
    return this.poly.contains(sx, sy)
  }

  private _hit_test(sx: number, sy: number): HitTarget | null {
    const {abs} = Math
    const EDGE_TOLERANCE = 2.5
    const tolerance = Math.max(EDGE_TOLERANCE, this.model.line_width/2)

    for (const [px, py, i] of this.poly) {
      if (abs(px - sx) < tolerance && abs(py - sy) < tolerance) {
        return {type: "node", i}
      }
    }

    const spt = {x: sx, y: sy}
    let j: number | null = null
    let dist = Infinity
    for (const [p0, p1, i] of this.poly.edges()) {
      const d = dist_to_segment(spt, p0, p1)
      if (d < tolerance && d < dist) {
        dist = d
        j = i
      }
    }

    if (j != null) {
      return {type: "edge", i: j}
    }

    if (this.poly.contains(sx, sy)) {
      return {type: "area"}
    }

    return null
  }

  private _can_hit(_target: HitTarget): boolean {
    return true
  }

  private _pan_state: {poly: Polygon, target: HitTarget} | null = null

  on_pan_start(ev: PanEvent): boolean {
    if (this.model.visible && this.model.editable) {
      const {sx, sy} = ev
      const target = this._hit_test(sx, sy)
      if (target != null && this._can_hit(target)) {
        this._pan_state = {
          poly: this.poly.clone(),
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

    const spoly = (() => {
      const {poly, target} = this._pan_state
      const {dx, dy} = ev

      switch (target.type) {
        case "node": {
          const {i} = target
          return poly.translate(dx, dy, i)
        }
        case "edge": {
          const {i} = target
          return poly.translate(dx, dy, i, i+1)
        }
        case "area": {
          return poly.translate(dx, dy)
        }
      }
    })()

    const {x, y} = this._mappers()
    const xs = x.v_invert(spoly.xs)
    const ys = y.v_invert(spoly.ys)

    this.model.update({xs, ys})
    this.model.pan.emit(["pan", ev.modifiers])
  }

  on_pan_end(ev: PanEvent): void {
    this._pan_state = null
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

    switch (target.type) {
      case "node": return "move"
      case "edge": return "move"
      case "area": return "move"
    }
  }
}

export namespace PolyAnnotation {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    xs: p.Property<Arrayable<number>>
    ys: p.Property<Arrayable<number>>
    xs_units: p.Property<CoordinateUnits>
    ys_units: p.Property<CoordinateUnits>
    editable: p.Property<boolean>
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

export interface PolyAnnotation extends PolyAnnotation.Attrs {}

export class PolyAnnotation extends Annotation {
  declare properties: PolyAnnotation.Props
  declare __view_type__: PolyAnnotationView

  constructor(attrs?: Partial<PolyAnnotation.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PolyAnnotationView

    this.mixins<PolyAnnotation.Mixins>([
      mixins.Line,
      mixins.Fill,
      mixins.Hatch,
      ["hover_", mixins.Line],
      ["hover_", mixins.Fill],
      ["hover_", mixins.Hatch],
    ])

    this.define<PolyAnnotation.Props>(({Bool, Float, Arrayable}) => ({
      xs:       [ Arrayable(Float), [] ],
      ys:       [ Arrayable(Float), [] ],
      xs_units: [ CoordinateUnits, "data" ],
      ys_units: [ CoordinateUnits, "data" ],
      editable: [ Bool, false ],
    }))

    this.override<PolyAnnotation.Props>({
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

  update({xs, ys}: {xs: Arrayable<number>, ys: Arrayable<number>}): void {
    this.setv({xs: xs.slice(), ys: ys.slice(), visible: true})
  }

  clear(): void {
    this.setv({xs: [], ys: [], visible: false})
  }
}
