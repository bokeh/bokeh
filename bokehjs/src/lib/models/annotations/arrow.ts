import {Annotation, AnnotationView} from "./annotation"
import {ArrowHead, ArrowHeadView, OpenHead} from "./arrow_head"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {ColumnDataSource} from "../sources/column_data_source"
import {LineVector} from "core/property_mixins"
import * as visuals from "core/visuals"
import {SpatialUnits} from "core/enums"
import {Arrayable} from "core/types"
import {build_view} from "core/build_views"
import * as p from "core/properties"
import {atan2} from "core/util/math"
import {Context2d} from "core/util/canvas"

export type Coords = [Arrayable<number>, Arrayable<number>]

export class ArrowView extends AnnotationView {
  model: Arrow
  visuals: Arrow.Visuals

  protected _x_start: Arrayable<number>
  protected _y_start: Arrayable<number>
  protected _x_end: Arrayable<number>
  protected _y_end: Arrayable<number>

  protected start: ArrowHeadView | null
  protected end: ArrowHeadView | null

  initialize(): void {
    super.initialize()
    this.set_data(this.model.source)
  }

  async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {start, end} = this.model
    const {parent} = this
    if (start != null)
      this.start = await build_view(start, {parent})
    if (end != null)
      this.end = await build_view(end, {parent})
  }

  remove(): void {
    this.start?.remove()
    this.end?.remove()
    super.remove()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.set_data(this.model.source))
    this.connect(this.model.source.streaming, () => this.set_data(this.model.source))
    this.connect(this.model.source.patching, () => this.set_data(this.model.source))
    this.connect(this.model.source.change, () => this.set_data(this.model.source))
  }

  set_data(source: ColumnarDataSource): void {
    super.set_data(source)
    this.visuals.warm_cache(source)
    this.plot_view.request_render()
  }

  protected _map_data(): [Coords, Coords] {
    const {frame} = this.plot_view

    let sx_start, sy_start
    if (this.model.start_units == 'data') {
      sx_start = this.coordinates.x_scale.v_compute(this._x_start)
      sy_start = this.coordinates.y_scale.v_compute(this._y_start)
    } else {
      sx_start = frame.xview.v_compute(this._x_start)
      sy_start = frame.yview.v_compute(this._y_start)
    }

    let sx_end, sy_end
    if (this.model.end_units == 'data') {
      sx_end = this.coordinates.x_scale.v_compute(this._x_end)
      sy_end = this.coordinates.y_scale.v_compute(this._y_end)
    } else {
      sx_end = frame.xview.v_compute(this._x_end)
      sy_end = frame.yview.v_compute(this._y_end)
    }

    return [[sx_start, sy_start], [sx_end, sy_end]]
  }

  protected _render(): void {
    const {ctx} = this.layer
    ctx.save()

    // Order in this function is important. First we draw all the arrow heads.
    const [start, end] = this._map_data()

    if (this.end != null)
      this._arrow_head(ctx, "render", this.end, start, end)
    if (this.start != null)
      this._arrow_head(ctx, "render", this.start, end, start)

    // Next we call .clip on all the arrow heads, inside an initial canvas sized
    // rect, to create an "inverted" clip region for the arrow heads
    ctx.beginPath()
    const {x, y, width, height} = this.plot_view.frame.bbox
    ctx.rect(x, y, width, height)
    if (this.end != null)
      this._arrow_head(ctx, "clip", this.end, start, end)
    if (this.start != null)
      this._arrow_head(ctx, "clip", this.start, end, start)
    ctx.closePath()
    ctx.clip()

    // Finally we draw the arrow body, with the clipping regions set up. This prevents
    // "fat" arrows from overlapping the arrow head in a bad way.
    this._arrow_body(ctx, start, end)

    ctx.restore()
  }

  protected _arrow_head(ctx: Context2d, action: "render" | "clip", head: ArrowHeadView, start: Coords, end: Coords): void {
    for (let i = 0, _end = this._x_start.length; i < _end; i++) {
      // arrow head runs orthogonal to arrow body
      const angle = Math.PI/2 + atan2([start[0][i], start[1][i]], [end[0][i], end[1][i]])

      ctx.save()

      ctx.translate(end[0][i], end[1][i])
      ctx.rotate(angle)

      if (action == "render")
        head.render(ctx, i)
      else if (action == "clip")
        head.clip(ctx, i)

      ctx.restore()
    }
  }

  protected _arrow_body(ctx: Context2d, start: Coords, end: Coords): void {
    if (!this.visuals.line.doit)
      return

    for (let i = 0, n = this._x_start.length; i < n; i++) {
      this.visuals.line.set_vectorize(ctx, i)

      ctx.beginPath()
      ctx.moveTo(start[0][i], start[1][i])
      ctx.lineTo(end[0][i], end[1][i])
      ctx.stroke()
    }
  }
}

export namespace Arrow {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    x_start: p.XCoordinateSpec
    y_start: p.YCoordinateSpec
    start_units: p.Property<SpatialUnits>
    start: p.Property<ArrowHead | null>
    x_end: p.XCoordinateSpec
    y_end: p.YCoordinateSpec
    end_units: p.Property<SpatialUnits>
    end: p.Property<ArrowHead | null>
    source: p.Property<ColumnarDataSource>
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = Annotation.Visuals & {line: visuals.LineVector}
}

export interface Arrow extends Arrow.Attrs {}

export class Arrow extends Annotation {
  properties: Arrow.Props
  __view_type__: ArrowView

  constructor(attrs?: Partial<Arrow.Attrs>) {
    super(attrs)
  }

  static init_Arrow(): void {
    this.prototype.default_view = ArrowView

    this.mixins<Arrow.Mixins>(LineVector)

    this.define<Arrow.Props>(({Ref, Nullable}) => ({
      x_start:     [ p.XCoordinateSpec ],
      y_start:     [ p.YCoordinateSpec ],
      start_units: [ SpatialUnits, "data" ],
      start:       [ Nullable(Ref(ArrowHead)), null ],
      x_end:       [ p.XCoordinateSpec ],
      y_end:       [ p.YCoordinateSpec ],
      end_units:   [ SpatialUnits, "data" ],
      end:         [ Nullable(Ref(ArrowHead)), () => new OpenHead() ],
      source:      [ Ref(ColumnarDataSource), () => new ColumnDataSource() ],
    }))
  }
}
