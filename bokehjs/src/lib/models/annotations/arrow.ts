import {DataAnnotation, DataAnnotationView} from "./data_annotation"
import {ArrowHead, ArrowHeadView, OpenHead} from "./arrow_head"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Context2d} from "core/util/canvas"
import {LineVector} from "core/property_mixins"
import * as visuals from "core/visuals"
import {SpatialUnits} from "core/enums"
import {FloatArray, ScreenArray} from "core/types"
import {build_view} from "core/build_views"
import * as p from "core/properties"
import {atan2} from "core/util/math"

export class ArrowView extends DataAnnotationView {
  model: Arrow
  visuals: Arrow.Visuals

  protected start: ArrowHeadView | null
  protected end: ArrowHeadView | null

  protected _x_start: FloatArray
  protected _y_start: FloatArray
  protected _x_end: FloatArray
  protected _y_end: FloatArray

  protected _sx_start: ScreenArray
  protected _sy_start: ScreenArray
  protected _sx_end: ScreenArray
  protected _sy_end: ScreenArray

  protected _angles: ScreenArray

  async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {start, end} = this.model
    if (start != null)
      this.start = await build_view(start, {parent: this})
    if (end != null)
      this.end = await build_view(end, {parent: this})
  }

  set_data(source: ColumnarDataSource): void {
    super.set_data(source)
    this.start?.set_data(source)
    this.end?.set_data(source)
  }

  remove(): void {
    this.start?.remove()
    this.end?.remove()
    super.remove()
  }

  map_data(): void {
    const {frame} = this.plot_view

    if (this.model.start_units == "data") {
      this._sx_start = this.coordinates.x_scale.v_compute(this._x_start)
      this._sy_start = this.coordinates.y_scale.v_compute(this._y_start)
    } else {
      this._sx_start = frame.bbox.xview.v_compute(this._x_start)
      this._sy_start = frame.bbox.yview.v_compute(this._y_start)
    }

    if (this.model.end_units == "data") {
      this._sx_end = this.coordinates.x_scale.v_compute(this._x_end)
      this._sy_end = this.coordinates.y_scale.v_compute(this._y_end)
    } else {
      this._sx_end = frame.bbox.xview.v_compute(this._x_end)
      this._sy_end = frame.bbox.yview.v_compute(this._y_end)
    }

    const {_sx_start, _sy_start, _sx_end, _sy_end} = this

    const n = _sx_start.length
    const angles = this._angles = new ScreenArray(n)

    for (let i = 0; i < n; i++) {
      // arrow head runs orthogonal to arrow body (???)
      angles[i] = Math.PI/2 + atan2([_sx_start[i], _sy_start[i]], [_sx_end[i], _sy_end[i]])
    }
  }

  paint(ctx: Context2d): void {
    const {start, end} = this

    const {_sx_start, _sy_start, _sx_end, _sy_end, _angles} = this
    const {x, y, width, height} = this.plot_view.frame.bbox

    for (let i = 0, n = _sx_start.length; i < n; i++) {
      if (end != null) {
        ctx.save()
        ctx.translate(_sx_end[i], _sy_end[i])
        ctx.rotate(_angles[i])
        end.render(ctx, i)
        ctx.restore()
      }

      if (start != null) {
        ctx.save()
        ctx.translate(_sx_start[i], _sy_start[i])
        ctx.rotate(_angles[i] + Math.PI)
        start.render(ctx, i)
        ctx.restore()
      }

      if (this.visuals.line.doit) {
        ctx.save()

        if (start != null || end != null) {
          ctx.beginPath()
          ctx.rect(x, y, width, height)

          if (end != null) {
            ctx.save()
            ctx.translate(_sx_end[i], _sy_end[i])
            ctx.rotate(_angles[i])
            end.clip(ctx, i)
            ctx.restore()
          }

          if (start != null) {
            ctx.save()
            ctx.translate(_sx_start[i], _sy_start[i])
            ctx.rotate(_angles[i] + Math.PI)
            start.clip(ctx, i)
            ctx.restore()
          }

          ctx.closePath()
          ctx.clip()
        }

        this.visuals.line.set_vectorize(ctx, i)
        ctx.beginPath()
        ctx.moveTo(_sx_start[i], _sy_start[i])
        ctx.lineTo(_sx_end[i], _sy_end[i])
        ctx.stroke()

        ctx.restore()
      }
    }
  }
}

export namespace Arrow {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataAnnotation.Props & {
    x_start: p.XCoordinateSpec
    y_start: p.YCoordinateSpec
    start_units: p.Property<SpatialUnits>
    start: p.Property<ArrowHead | null>
    x_end: p.XCoordinateSpec
    y_end: p.YCoordinateSpec
    end_units: p.Property<SpatialUnits>
    end: p.Property<ArrowHead | null>
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = DataAnnotation.Visuals & {line: visuals.LineVector}
}

export interface Arrow extends Arrow.Attrs {}

export class Arrow extends DataAnnotation {
  properties: Arrow.Props
  __view_type__: ArrowView

  constructor(attrs?: Partial<Arrow.Attrs>) {
    super(attrs)
  }

  static init_Arrow(): void {
    this.prototype.default_view = ArrowView

    this.mixins<Arrow.Mixins>(LineVector)

    this.define<Arrow.Props>(({Ref, Nullable}) => ({
      x_start:     [ p.XCoordinateSpec, {field: "x_start"} ],
      y_start:     [ p.YCoordinateSpec, {field: "y_start"} ],
      start_units: [ SpatialUnits, "data" ],
      start:       [ Nullable(Ref(ArrowHead)), null ],
      x_end:       [ p.XCoordinateSpec, {field: "x_end"} ],
      y_end:       [ p.YCoordinateSpec, {field: "y_end"} ],
      end_units:   [ SpatialUnits, "data" ],
      end:         [ Nullable(Ref(ArrowHead)), () => new OpenHead() ],
    }))
  }
}
