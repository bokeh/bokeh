import {Annotation, AnnotationView} from "./annotation"
import {Scale} from "../scales/scale"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import {CoordinateUnits} from "core/enums"
import {Arrayable} from "core/types"
import {point_in_poly} from "core/hittest"
import {Signal} from "core/signaling"
import {PanEvent, Pannable} from "core/ui_events"
import {CoordinateMapper} from "core/util/bbox"
import {zip, enumerate} from "core/util/iterator"
import {copy, map} from "core/util/arrayable"
import {assert} from "core/util/assert"
import * as p from "core/properties"

export type Node = {
  type: "node"
  i: number
}

export type Poly = {
  type: "poly"
}

export type HitTarget = Node | Poly

export class PolyAnnotationView extends AnnotationView implements Pannable {
  override model: PolyAnnotation
  override visuals: PolyAnnotation.Visuals

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_render())
  }

  protected sxs: Arrayable<number> = []
  protected sys: Arrayable<number> = []

  protected _render(): void {
    const {xs, ys} = this.model

    if (xs.length != ys.length)
      return

    const {frame} = this.plot_view
    const {ctx} = this.layer

    const xscale = this.coordinates.x_scale
    const yscale = this.coordinates.y_scale

    function _calc_dim(values: Arrayable<number>, units: CoordinateUnits, scale: Scale, view: CoordinateMapper): Arrayable<number> {
      switch (units) {
        case "canvas":
          return values
        case "screen":
          return view.v_compute(values)
        case "data":
          return scale.v_compute(values)
      }
    }

    this.sxs = _calc_dim(xs, this.model.xs_units, xscale, frame.bbox.xview)
    this.sys = _calc_dim(ys, this.model.ys_units, yscale, frame.bbox.yview)

    const n = xs.length

    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      ctx.lineTo(this.sxs[i], this.sys[i])
    }

    if (n >= 3) {
      ctx.closePath()
      this.visuals.fill.apply(ctx)
      this.visuals.hatch.apply(ctx)
    }

    this.visuals.line.apply(ctx)
  }

  override interactive_hit(sx: number, sy: number): boolean {
    if (!this.model.visible || !this.model.editable)
      return false
    return point_in_poly(sx, sy, this.sxs, this.sys)
  }

  private _hit_test(sx: number, sy: number): HitTarget | null {
    const {abs} = Math
    const EDGE_TOLERANCE = 2.5
    const tolerance = Math.max(EDGE_TOLERANCE, this.model.line_width/2)

    for (const [[psx, psy], i] of enumerate(zip(this.sxs, this.sys))) {
      if (abs(psx - sx) < tolerance && abs(psy - sy) < tolerance)
        return {type: "node", i}
    }

    if (point_in_poly(sx, sy, this.sxs, this.sys))
      return {type: "poly"}

    return null
  }

  private _pan_state: {
    sxs: Arrayable<number>
    sys: Arrayable<number>
    target: HitTarget
  } | null = null

  _pan_start(ev: PanEvent): boolean {
    if (this.model.visible && this.model.editable) {
      const {sx, sy} = ev
      const target = this._hit_test(sx, sy)
      if (target != null) {
        this._pan_state = {
          sxs: copy(this.sxs),
          sys: copy(this.sys),
          target,
        }
        this.model.pan.emit("pan:start")
        return true
      }
    }
    return false
  }

  _pan(ev: PanEvent): void {
    assert(this._pan_state != null)

    const dx = ev.deltaX
    const dy = ev.deltaY

    const [sxs, sys] = (() => {
      const {sxs, sys, target} = this._pan_state

      switch (target.type) {
        case "node": {
          const {i} = target
          return [
            map(sxs, (sx, j) => i == j ? sx + dx : sx),
            map(sys, (sy, j) => i == j ? sy + dy : sy),
          ]
        }
        case "poly": {
          return [
            map(sxs, (sx) => sx + dx),
            map(sys, (sy) => sy + dy),
          ]
        }
      }
    })()

    const invert = (svs: Arrayable<number>, units: CoordinateUnits, scale: Scale, view: CoordinateMapper, canvas: CoordinateMapper) => {
      switch (units) {
        case "canvas": return canvas.v_invert(svs)
        case "screen": return view.v_invert(svs)
        case "data":   return scale.v_invert(svs)
      }
    }

    const {x_scale, y_scale} = this.coordinates
    const {xview, yview} = this.plot_view.frame.bbox
    const {xscreen, yscreen} = this.plot_view.canvas.bbox

    const xs = invert(sxs, this.model.xs_units, x_scale, xview, xscreen)
    const ys = invert(sys, this.model.ys_units, y_scale, yview, yscreen)

    this.model.update({xs, ys})
    this.model.pan.emit("pan")
  }

  _pan_end(_ev: PanEvent): void {
    this._pan_state = null
    this.model.pan.emit("pan:end")
  }

  override cursor(sx: number, sy: number): string | null {
    const target = this._pan_state?.target ?? this._hit_test(sx, sy)
    return target == null ? null : "move"
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

  export type Mixins = mixins.Line & mixins.Fill & mixins.Hatch

  export type Visuals = Annotation.Visuals & {line: visuals.Line, fill: visuals.Fill, hatch: visuals.Hatch}
}

export interface PolyAnnotation extends PolyAnnotation.Attrs {}

export class PolyAnnotation extends Annotation {
  override properties: PolyAnnotation.Props
  override __view_type__: PolyAnnotationView

  constructor(attrs?: Partial<PolyAnnotation.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PolyAnnotationView

    this.mixins<PolyAnnotation.Mixins>([mixins.Line, mixins.Fill, mixins.Hatch])

    this.define<PolyAnnotation.Props>(({Boolean, Number, Arrayable}) => ({
      xs:       [ Arrayable(Number), [] ],
      ys:       [ Arrayable(Number), [] ],
      xs_units: [ CoordinateUnits, "data" ],
      ys_units: [ CoordinateUnits, "data" ],
      editable: [ Boolean, false ],
    }))

    this.override<PolyAnnotation.Props>({
      fill_color: "#fff9ba",
      fill_alpha: 0.4,
      line_color: "#cccccc",
      line_alpha: 0.3,
    })
  }

  readonly pan = new Signal<"pan:start" | "pan" | "pan:end", this>(this, "pan")

  update({xs, ys}: {xs: Arrayable<number>, ys: Arrayable<number>}): void {
    this.setv({xs, ys, visible: true})
  }

  clear(): void {
    this.setv({xs: [], ys: [], visible: false})
  }
}
