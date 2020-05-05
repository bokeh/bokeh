import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {generic_line_legend} from "./utils"
import {LineVector} from "core/property_mixins"
import {Line} from "core/visuals"
import {Rect, NumberArray} from "core/types"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"

export interface RayData extends XYGlyphData {
  _length: NumberArray
  _angle: NumberArray

  slength: NumberArray
}

export interface RayView extends RayData {}

export class RayView extends XYGlyphView {
  model: Ray
  visuals: Ray.Visuals

  protected _map_data(): void {
    if (this.model.properties.length.units == "data")
      this.slength = this.sdist(this.renderer.xscale, this._x, this._length)
    else
      this.slength = this._length
  }

  protected _render(ctx: Context2d, indices: number[], {sx, sy, slength, _angle}: RayData): void {
    if (this.visuals.line.doit) {
      const width = this.renderer.plot_view.frame.bbox.width
      const height = this.renderer.plot_view.frame.bbox.height
      const inf_len = 2 * (width + height)

      for (let i = 0, end = slength.length; i < end; i++) {
        if (slength[i] == 0)
          slength[i] = inf_len
      }

      for (const i of indices) {
        if (isNaN(sx[i] + sy[i] + _angle[i] + slength[i]))
          continue

        ctx.translate(sx[i], sy[i])
        ctx.rotate(_angle[i])

        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(slength[i], 0)

        this.visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

        ctx.rotate(-_angle[i])
        ctx.translate(-sx[i], -sy[i])
      }
    }
  }

  draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Ray {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    length: p.DistanceSpec
    angle: p.AngleSpec
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = XYGlyph.Visuals & {line: Line}
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
    this.define<Ray.Props>({
      length: [ p.DistanceSpec ],
      angle:  [ p.AngleSpec    ],
    })
  }
}
