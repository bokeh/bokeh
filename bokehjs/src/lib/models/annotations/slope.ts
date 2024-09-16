import {Annotation, AnnotationView} from "./annotation"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"

export class SlopeView extends AnnotationView {
  declare model: Slope
  declare visuals: Slope.Visuals

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_paint())
  }

  protected _paint(ctx: Context2d): void {
    const {gradient, y_intercept} = this.model
    if (gradient == null || y_intercept == null) {
      return
    }

    const {frame} = this.plot_view

    const xscale = this.coordinates.x_scale
    const yscale = this.coordinates.y_scale

    const [sx0, sx1, sy0, sy1] = (() => {
      if (gradient == 0) {
        const sy_start = yscale.compute(y_intercept)
        const sy_end = sy_start

        const sx_start = frame.bbox.left
        const sx_end = frame.bbox.right
        return [sx_start, sx_end, sy_start, sy_end]
      } else {
        const sy_start = frame.bbox.top
        const sy_end = frame.bbox.bottom

        const y_start = yscale.invert(sy_start)
        const y_end = yscale.invert(sy_end)

        const x_start = (y_start - y_intercept) / gradient
        const x_end = (y_end - y_intercept) / gradient

        const sx_start = xscale.compute(x_start)
        const sx_end = xscale.compute(x_end)

        if (sx_start <= sx_end) {
          return [sx_start, sx_end, sy_start, sy_end]
        } else {
          return [sx_end, sx_start, sy_end, sy_start]
        }
      }
    })()

    ctx.save()

    if (this.visuals.above_fill.doit || this.visuals.above_hatch.doit) {
      const {left, right, top, bottom} = frame.bbox
      ctx.beginPath()
      ctx.moveTo(sx0, sy0)
      ctx.lineTo(sx0, sy0)
      ctx.lineTo(sx1, sy1)
      ctx.lineTo(sx1, sy1)
      if (sy0 <= sy1) {
        if (sx1 < right) {
          ctx.lineTo(right, bottom)
        }
        ctx.lineTo(right, top)
        ctx.lineTo(left, top)
      } else {
        ctx.lineTo(right, top)
        ctx.lineTo(left, top)
        if (sx0 > left) {
          ctx.lineTo(left, bottom)
        }
      }
      ctx.closePath()
      this.visuals.above_fill.apply(ctx)
      this.visuals.above_hatch.apply(ctx)
    }

    if (this.visuals.below_fill.doit || this.visuals.below_hatch.doit) {
      const {left, right, top, bottom} = frame.bbox
      ctx.beginPath()
      ctx.moveTo(sx0, sy0)
      ctx.lineTo(sx0, sy0)
      ctx.lineTo(sx1, sy1)
      if (sy0 <= sy1) {
        ctx.lineTo(right, bottom)
        ctx.lineTo(left, bottom)
        if (sx0 > left) {
          ctx.lineTo(left, top)
        }
      } else {
        if (sx1 < right) {
          ctx.lineTo(right, top)
        }
        ctx.lineTo(right, bottom)
        ctx.lineTo(left, bottom)
      }
      ctx.closePath()
      this.visuals.below_fill.apply(ctx)
      this.visuals.below_hatch.apply(ctx)
    }

    ctx.beginPath()
    ctx.moveTo(sx0, sy0)
    ctx.lineTo(sx1, sy1)

    this.visuals.line.apply(ctx)
    ctx.restore()
  }
}

export namespace Slope {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    gradient: p.Property<number | null>
    y_intercept: p.Property<number | null>
  } & Mixins

  export type Mixins =
    mixins.Line &
    mixins.AboveFill & mixins.AboveHatch &
    mixins.BelowFill & mixins.BelowHatch

  export type Visuals = Annotation.Visuals & {
    line: visuals.Line
    above_fill: visuals.Fill
    above_hatch: visuals.Hatch
    below_fill: visuals.Fill
    below_hatch: visuals.Hatch
  }
}

export interface Slope extends Slope.Attrs {}

export class Slope extends Annotation {
  declare properties: Slope.Props
  declare __view_type__: SlopeView

  constructor(attrs?: Partial<Slope.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SlopeView

    this.mixins<Slope.Mixins>([
      mixins.Line,
      ["above_", mixins.Fill],
      ["above_", mixins.Hatch],
      ["below_", mixins.Fill],
      ["below_", mixins.Hatch],
    ])

    this.define<Slope.Props>(({Float, Nullable}) => ({
      gradient:    [ Nullable(Float), null ],
      y_intercept: [ Nullable(Float), null ],
    }))

    this.override<Slope.Props>({
      line_color: "black",
      above_fill_color: null,
      above_fill_alpha: 0.4,
      below_fill_color: null,
      below_fill_alpha: 0.4,
    })
  }
}
