import {DataAnnotation, DataAnnotationView} from "./data_annotation"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import {SpatialUnits} from "core/enums"
import {TextBox} from "core/graphics"
import * as p from "core/properties"
import {Arrayable} from "core/types"
import {Context2d} from "core/util/canvas"

export class LabelSetView extends DataAnnotationView {
  override model: LabelSet
  override visuals: LabelSet.Visuals

  protected _x: Arrayable<number>
  protected _y: Arrayable<number>
  protected sx: Arrayable<number>
  protected sy: Arrayable<number>
  protected text: p.Uniform<string | null>
  protected angle: p.Uniform<number>
  protected x_offset: p.Uniform<number>
  protected y_offset: p.Uniform<number>

  map_data(): void {
    const {x_scale, y_scale} = this.coordinates
    const panel = this.layout != null ? this.layout : this.plot_view.frame

    this.sx = this.model.x_units == "data" ? x_scale.v_compute(this._x) : panel.bbox.xview.v_compute(this._x)
    this.sy = this.model.y_units == "data" ? y_scale.v_compute(this._y) : panel.bbox.yview.v_compute(this._y)
  }

  paint(): void {
    const {ctx} = this.layer

    for (let i = 0, end = this.text.length; i < end; i++) {
      const x_offset_i = this.x_offset.get(i)
      const y_offset_i = this.y_offset.get(i)
      const sx_i = this.sx[i] + x_offset_i
      const sy_i = this.sy[i] - y_offset_i
      const angle_i = this.angle.get(i)
      const text_i = this.text.get(i)

      if (!isFinite(sx_i + sy_i + angle_i) || text_i == null)
        continue

      this._paint(ctx, i, text_i, sx_i, sy_i, angle_i)
    }
  }

  protected _paint(ctx: Context2d, i: number, text: string, sx: number, sy: number, angle: number): void {
    const graphics = new TextBox({text})
    graphics.angle = angle
    graphics.position = {sx, sy}
    graphics.visuals = this.visuals.text.values(i)

    const {background_fill, border_line} = this.visuals
    if (background_fill.doit || border_line.doit) {
      const {p0, p1, p2, p3} = graphics.rect()
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.lineTo(p3.x, p3.y)
      ctx.closePath()

      this.visuals.background_fill.apply(ctx, i)
      this.visuals.border_line.apply(ctx, i)
    }

    if (this.visuals.text.doit)
      graphics.paint(ctx)
  }
}

export namespace LabelSet {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataAnnotation.Props & {
    x: p.XCoordinateSpec
    y: p.YCoordinateSpec
    x_units: p.Property<SpatialUnits>
    y_units: p.Property<SpatialUnits>
    text: p.NullStringSpec
    angle: p.AngleSpec
    x_offset: p.NumberSpec
    y_offset: p.NumberSpec
  } & Mixins

  export type Mixins =
    mixins.TextVector &
    mixins.Prefixed<"border", mixins.LineVector> &
    mixins.Prefixed<"background", mixins.FillVector>

  export type Visuals = DataAnnotation.Visuals & {
    text: visuals.TextVector
    border_line: visuals.LineVector
    background_fill: visuals.FillVector
  }
}

export interface LabelSet extends LabelSet.Attrs {}

export class LabelSet extends DataAnnotation {
  override properties: LabelSet.Props
  override __view_type__: LabelSetView

  constructor(attrs?: Partial<LabelSet.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LabelSetView

    this.mixins<LabelSet.Mixins>([
      mixins.TextVector,
      ["border_",     mixins.LineVector],
      ["background_", mixins.FillVector],
    ])

    this.define<LabelSet.Props>(() => ({
      x:            [ p.XCoordinateSpec, {field: "x"} ],
      y:            [ p.YCoordinateSpec, {field: "y"} ],
      x_units:      [ SpatialUnits, "data" ],
      y_units:      [ SpatialUnits, "data" ],
      text:         [ p.NullStringSpec, {field: "text"} ],
      angle:        [ p.AngleSpec, 0 ],
      x_offset:     [ p.NumberSpec, {value: 0} ],
      y_offset:     [ p.NumberSpec, {value: 0} ],
    }))

    this.override<LabelSet.Props>({
      background_fill_color: null,
      border_line_color: null,
    })
  }
}
