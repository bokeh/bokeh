import {Annotation, AnnotationView} from "./annotation"
import {Scale} from "../scales/scale"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import {CoordinateUnits, Dimension} from "core/enums"
import {PanEvent, Pannable} from "core/ui_events"
import {Signal} from "core/signaling"
import * as p from "core/properties"
import {assert} from "core/util/assert"
import {CoordinateMapper} from "core/util/bbox"
import * as cursors from "core/util/cursors"

type HitTarget = "edge"

export class SpanView extends AnnotationView implements Pannable {
  override model: Span
  override visuals: Span.Visuals

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.plot_view.request_paint(this))
  }

  protected sloc: number

  protected _render(): void {
    const {location} = this.model
    if (location == null)
      return

    const {frame, canvas} = this.plot_view

    const xscale = this.coordinates.x_scale
    const yscale = this.coordinates.y_scale

    const _calc_dim = (scale: Scale, view: CoordinateMapper, canvas: CoordinateMapper): number => {
      switch (this.model.location_units) {
        case "canvas":
          return canvas.compute(location)
        case "screen":
          return view.compute(location)
        case "data":
          return scale.compute(location)
      }
    }

    let height: number, sleft: number, stop: number, width: number
    if (this.model.dimension == "width") {
      this.sloc = stop = _calc_dim(yscale, frame.bbox.y_view, canvas.bbox.y_screen)
      sleft = frame.bbox.left
      width = frame.bbox.width
      height = this.model.line_width
    } else {
      stop = frame.bbox.top
      this.sloc = sleft = _calc_dim(xscale, frame.bbox.x_view, canvas.bbox.x_screen)
      width = this.model.line_width
      height = frame.bbox.height
    }

    const {ctx} = this.layer
    ctx.save()

    ctx.beginPath()
    this.visuals.line.set_value(ctx)
    ctx.moveTo(sleft, stop)
    if (this.model.dimension == "width") {
      ctx.lineTo(sleft + width, stop)
    } else {
      ctx.lineTo(sleft, stop + height)
    }
    ctx.stroke()

    ctx.restore()
  }

  override interactive_hit(sx: number, sy: number): boolean {
    if (!this.model.visible || !this.model.editable)
      return false
    return this._hit_test(sx, sy) != null
  }

  private _hit_test(sx: number, sy: number): HitTarget | null {
    const {abs} = Math
    const EDGE_TOLERANCE = 2.5
    const tolerance = Math.max(EDGE_TOLERANCE, this.model.line_width/2)

    const sv = this.model.dimension == "width" ? sy : sx
    if (abs(this.sloc - sv) < tolerance)
      return "edge"

    return null
  }

  private _pan_state: {sloc: number, target: HitTarget} | null = null

  _pan_start(ev: PanEvent): boolean {
    if (this.model.visible && this.model.editable) {
      const {sx, sy} = ev
      const target = this._hit_test(sx, sy)
      if (target != null) {
        const {sloc} = this
        this._pan_state = {sloc, target}
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

    const sloc = (() => {
      const {sloc} = this._pan_state
      return sloc + (this.model.dimension == "width" ? dy : dx)
    })()

    const invert = (sloc: number, units: CoordinateUnits, scale: Scale, view: CoordinateMapper, canvas: CoordinateMapper) => {
      switch (units) {
        case "canvas": return canvas.invert(sloc)
        case "screen": return view.invert(sloc)
        case "data":   return scale.invert(sloc)
      }
    }

    const {x_scale, y_scale} = this.coordinates
    const {x_view, y_view} = this.plot_view.frame.bbox
    const {x_screen, y_screen} = this.plot_view.canvas.bbox

    const loc = (() => {
      if (this.model.dimension == "width")
        return invert(sloc, this.model.location_units, y_scale, y_view, y_screen)
      else
        return invert(sloc, this.model.location_units, x_scale, x_view, x_screen)
    })()
    this.model.location = loc

    this.model.pan.emit("pan")
  }

  _pan_end(_ev: PanEvent): void {
    this._pan_state = null
    this.model.pan.emit("pan:end")
  }

  override cursor(sx: number, sy: number): string | null {
    const target = this._pan_state?.target ?? this._hit_test(sx, sy)
    if (target == null)
      return null
    else
      return this.model.dimension == "width" ? cursors.y_pan : cursors.x_pan
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

  export type Mixins = mixins.Line

  export type Visuals = Annotation.Visuals & {line: visuals.Line}
}

export interface Span extends Span.Attrs {}

export class Span extends Annotation {
  override properties: Span.Props
  override __view_type__: SpanView

  constructor(attrs?: Partial<Span.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SpanView

    this.mixins<Span.Mixins>(mixins.Line)

    this.define<Span.Props>(({Boolean, Number, Nullable}) => ({
      location:       [ Nullable(Number), null ],
      location_units: [ CoordinateUnits, "data" ],
      dimension:      [ Dimension, "width" ],
      editable:       [ Boolean, false ],
    }))

    this.override<Span.Props>({
      line_color: "black",
    })
  }

  readonly pan = new Signal<"pan:start" | "pan" | "pan:end", this>(this, "pan")
}
