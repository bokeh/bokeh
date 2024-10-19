import {XYGlyph, XYGlyphView} from "./xy_glyph"
import type * as p from "core/properties"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import type {Arrayable, int} from "core/types"
import type {Context2d} from "core/util/canvas"
import {catmullrom_spline} from "core/util/interpolation"
import {PI, slope} from "core/util/math"

export interface SplineView extends Spline.Data {}

export class SplineView extends XYGlyphView {
  declare model: Spline
  declare visuals: Spline.Visuals

  protected override _set_data(): void {
    const {tension, closed} = this.model
    const [xt, yt] = catmullrom_spline(this.x, this.y, 20, tension, closed)
    this._define_attr<Spline.Data>("xt", xt)
    this._define_attr<Spline.Data>("yt", yt)
  }

  protected override _map_data(): void {
    const {x_scale, y_scale} = this.renderer.coordinates
    const sxt = x_scale.v_compute(this.xt)
    const syt = y_scale.v_compute(this.yt)
    this._define_attr<Spline.Data>("sxt", sxt)
    this._define_attr<Spline.Data>("syt", syt)
  }

  protected _paint(ctx: Context2d, _indices: number[], data?: Partial<Spline.Data>): void {
    const {sxt, syt} = {...this, ...data}
    const n = sxt.length

    if (this.visuals.line.doit) {
      let move = true

      ctx.beginPath()
      for (let j = 0; j < n; j++) {
        const sx_i = sxt[j]
        const sy_i = syt[j]

        if (!isFinite(sx_i + sy_i)) {
          move = true
        } else {
          if (move) {
            ctx.moveTo(sx_i, sy_i)
            move = false
          } else {
            ctx.lineTo(sx_i, sy_i)
          }
        }
      }

      this.visuals.line.apply(ctx)
    }

    this._render_decorations(ctx, 0, sxt, syt, 0, n - 1)
  }

  protected _render_decorations(ctx: Context2d, i: int, sxt: Arrayable<number>, syt: Arrayable<number>, start: int, end: int): void {
    for (const decoration of this.decorations.values()) {
      const parameters = (() => {
        switch (decoration.model.node) {
          case "start": {
            const sx0 = sxt[start]
            const sy0 = syt[start]
            const sx1 = sxt[start + 1]
            const sy1 = syt[start + 1]
            if (!isFinite(sx0 + sy0 + sx1 + sy1)) {
              return null
            }
            const angle = slope([sx0, sy0], [sx1, sy1]) + PI/2 + PI
            return {sx: sx0, sy: sy0, angle}
          }
          case "middle": {
            return null // TODO
          }
          case "end": {
            const sx0 = sxt[end-1]
            const sy0 = syt[end-1]
            const sx1 = sxt[end]
            const sy1 = syt[end]
            if (!isFinite(sx0 + sy0 + sx1 + sy1)) {
              return null
            }
            const angle = slope([sx0, sy0], [sx1, sy1]) + PI/2
            return {sx: sx1, sy: sy1, angle}
          }
        }
      })()

      if (parameters == null) {
        continue
      }

      const {sx, sy, angle} = parameters
      ctx.translate(sx, sy)
      ctx.rotate(angle)
      decoration.marking.paint(ctx, i) // ??? scalar marking
      ctx.rotate(-angle)
      ctx.translate(-sx, -sy)
    }
  }
}

export namespace Spline {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & Mixins & {
    tension: p.Property<number>
    closed: p.Property<boolean>
  }

  export type Mixins = mixins.LineScalar

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineScalar}

  export type Data = p.GlyphDataOf<Props> & {
    readonly xt: Arrayable<number>
    readonly yt: Arrayable<number>
    readonly sxt: Arrayable<number>
    readonly syt: Arrayable<number>
  }
}

export interface Spline extends Spline.Attrs {}

export class Spline extends XYGlyph {
  declare properties: Spline.Props
  declare __view_type__: SplineView

  constructor(attrs?: Partial<Spline.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SplineView

    this.mixins<Spline.Mixins>(mixins.LineScalar)

    this.define<Spline.Props>(({Bool, Float}) => ({
      tension: [ Float,  0.5   ],
      closed:  [ Bool, false ],
    }))
  }
}
