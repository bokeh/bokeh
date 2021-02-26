import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {generic_line_vector_legend} from "./utils"
import {LineVector} from "core/property_mixins"
import * as visuals from "core/visuals"
import {Rect, ScreenArray, to_screen} from "core/types"
import {Direction} from "core/enums"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"

export type ArcData = XYGlyphData & p.UniformsOf<Arc.Mixins> & {
  readonly radius: p.Uniform<number>
  sradius: ScreenArray
  readonly max_radius: number

  readonly start_angle: p.Uniform<number>
  readonly end_angle: p.Uniform<number>
}

export interface ArcView extends ArcData {}

export class ArcView extends XYGlyphView {
  model: Arc
  visuals: Arc.Visuals

  protected _map_data(): void {
    if (this.model.properties.radius.units == "data")
      this.sradius = this.sdist(this.renderer.xscale, this._x, this.radius)
    else
      this.sradius = to_screen(this.radius)
  }

  protected _render(ctx: Context2d, indices: number[], data?: ArcData): void {
    if (this.visuals.line.doit) {
      const {sx, sy, sradius, start_angle, end_angle} = data ?? this
      const anticlock = this.model.direction == "anticlock"

      for (const i of indices) {
        const sx_i = sx[i]
        const sy_i = sy[i]
        const sradius_i = sradius[i]
        const start_angle_i = start_angle.get(i)
        const end_angle_i = end_angle.get(i)

        if (isNaN(sx_i + sy_i + sradius_i + start_angle_i + end_angle_i))
          continue

        ctx.beginPath()
        ctx.arc(sx_i, sy_i, sradius_i, start_angle_i, end_angle_i, anticlock)

        this.visuals.line.set_vectorize(ctx, i)
        ctx.stroke()
      }
    }
  }

  draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_vector_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Arc {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    direction: p.Property<Direction>
    radius: p.DistanceSpec
    start_angle: p.AngleSpec
    end_angle: p.AngleSpec
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineVector}
}

export interface Arc extends Arc.Attrs {}

export class Arc extends XYGlyph {
  properties: Arc.Props
  __view_type__: ArcView

  constructor(attrs?: Partial<Arc.Attrs>) {
    super(attrs)
  }

  static init_Arc(): void {
    this.prototype.default_view = ArcView

    this.mixins<Arc.Mixins>(LineVector)

    this.define<Arc.Props>(({}) => ({
      direction:   [ Direction, "anticlock" ],
      radius:      [ p.DistanceSpec, {field: "radius"} ],
      start_angle: [ p.AngleSpec, {field: "start_angle"} ],
      end_angle:   [ p.AngleSpec, {field: "end_angle"} ],
    }))
  }
}
