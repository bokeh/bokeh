import {XYGlyph, XYGlyphView} from "./xy_glyph"
import {inherit} from "./glyph"
import {generic_line_vector_legend} from "./utils"
import {LineVector} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type {Rect} from "core/types"
import {to_screen} from "core/types"
import * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import {PI} from "core/util/math"

export interface RayView extends Ray.Data {}

export class RayView extends XYGlyphView {
  declare model: Ray
  declare visuals: Ray.Visuals

  protected override _map_data(): void {
    this._define_or_inherit_attr<Ray.Data>("slength", () => {
      if (this.model.properties.length.units == "data") {
        if (this.inherited_x && this.inherited_length) {
          return inherit
        } else {
          return this.sdist(this.renderer.xscale, this.x, this.length)
        }
      } else {
        return this.inherited_length ? inherit : to_screen(this.length)
      }
    })

    if (!this.inherited_slength) {
      const {width, height} = this.renderer.plot_view.frame.bbox
      const inf_len = 2*(width + height)

      const {slength} = this
      const n = slength.length
      for (let i = 0; i < n; i++) {
        if (slength[i] == 0) {
          slength[i] = inf_len
        }
      }
    }
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<Ray.Data>): void {
    if (!this.visuals.line.doit) {
      return
    }

    const {sx, sy, slength, angle} = {...this, ...data}

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const angle_i = angle.get(i)
      const slength_i = slength[i]

      if (!isFinite(sx_i + sy_i + angle_i + slength_i)) {
        continue
      }

      ctx.translate(sx_i, sy_i)
      ctx.rotate(angle_i)

      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(slength_i, 0)
      this.visuals.line.apply(ctx, i)

      this._render_decorations(ctx, i, 0, 0, slength_i)

      ctx.rotate(-angle_i)
      ctx.translate(-sx_i, -sy_i)
    }
  }

  protected _render_decorations(ctx: Context2d, i: number, sx0: number, sy0: number, slength: number): void {
    const angle = PI/2
    const sx1 = sx0 + slength
    const sy1 = sy0

    for (const decoration of this.decorations.values()) {
      const {sx, sy, rotation=0} = (() => {
        switch (decoration.model.node) {
          case "start":  return {sx: sx0, sy: sy0, rotation: PI}
          case "middle": return {sx: (sx0 + sx1)/2, sy: (sy0 + sy1)/2}
          case "end":    return {sx: sx1, sy: sy1}
        }
      })()

      ctx.translate(sx, sy)
      ctx.rotate(angle + rotation)
      decoration.marking.paint(ctx, i)
      ctx.rotate(-angle - rotation)
      ctx.translate(-sx, -sy)
    }
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
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

  export type Data = p.GlyphDataOf<Props>
}

export interface Ray extends Ray.Attrs {}

export class Ray extends XYGlyph {
  declare properties: Ray.Props
  declare __view_type__: RayView

  constructor(attrs?: Partial<Ray.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = RayView

    this.mixins<Ray.Mixins>(LineVector)
    this.define<Ray.Props>(({}) => ({
      length: [ p.DistanceSpec, 0 ],
      angle:  [ p.AngleSpec, 0 ],
    }))
  }
}
