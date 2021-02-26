import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {generic_line_vector_legend} from "./utils"
import {LineVector} from "core/property_mixins"
import * as visuals from "core/visuals"
import {Rect, ScreenArray, to_screen} from "core/types"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"

export type RayData = XYGlyphData & p.UniformsOf<Ray.Mixins> & {
  readonly length: p.Uniform<number>
  readonly angle: p.Uniform<number>

  slength: ScreenArray
}

export interface RayView extends RayData {}

export class RayView extends XYGlyphView {
  model: Ray
  visuals: Ray.Visuals

  protected _map_data(): void {
    if (this.model.properties.length.units == "data")
      this.slength = this.sdist(this.renderer.xscale, this._x, this.length)
    else
      this.slength = to_screen(this.length)

    const {width, height} = this.renderer.plot_view.frame.bbox
    const inf_len = 2*(width + height)

    const {slength} = this
    for (let i = 0, end = slength.length; i < end; i++) {
      if (slength[i] == 0)
        slength[i] = inf_len
    }
  }

  protected _render(ctx: Context2d, indices: number[], data?: RayData): void {
    const {sx, sy, slength, angle} = data ?? this

    if (this.visuals.line.doit) {
      for (const i of indices) {
        const sx_i = sx[i]
        const sy_i = sy[i]
        const angle_i = angle.get(i)
        const slength_i = slength[i]

        if (isNaN(sx_i + sy_i + angle_i + slength_i))
          continue

        ctx.translate(sx_i, sy_i)
        ctx.rotate(angle_i)

        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(slength_i, 0)

        this.visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

        ctx.rotate(-angle_i)
        ctx.translate(-sx_i, -sy_i)
      }
    }
  }

  draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_vector_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Ray {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    length: p.DistanceSpec
    angle: p.AngleSpec
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineVector}
}

export interface Ray extends Ray.Attrs {}

export class Ray extends XYGlyph {
  properties: Ray.Props
  __view_type__: RayView

  constructor(attrs?: Partial<Ray.Attrs>) {
    super(attrs)
  }

  static init_Ray(): void {
    this.prototype.default_view = RayView

    this.mixins<Ray.Mixins>(LineVector)
    this.define<Ray.Props>(({}) => ({
      length: [ p.DistanceSpec, 0 ],
      angle:  [ p.AngleSpec, 0 ],
    }))
  }
}
