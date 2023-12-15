import {Shape, ShapeView} from "./shape"
import {Line} from "core/property_mixins"
import type {Arrayable} from "core/types"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import {catmullrom_spline} from "core/util/interpolation"
import {zip} from "core/util/iterator"

export class SplineView extends ShapeView {
  declare model: Spline
  declare visuals: Spline.Visuals

  get geometry() {
    const {xs, ys, tension, closed} = this.model
    const [xst, yst] = catmullrom_spline(xs, ys, 20, tension, closed)

    const {x_scale, y_scale} = this.scales
    return {
      sxs: x_scale.v_compute(xs),
      sys: y_scale.v_compute(ys),
      sxst: x_scale.v_compute(xst),
      syst: y_scale.v_compute(yst),
    }
  }

  paint(ctx: Context2d): void {
    const {sxst, syst} = this.geometry

    ctx.beginPath()
    for (const [sx, sy] of zip(sxst, syst)) {
      if (!isFinite(sx + sy)) {
        break
      }
      ctx.lineTo(sx, sy)
    }

    this.visuals.line.apply(ctx)
  }
}

export namespace Spline {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & Mixins & {
    xs: p.Property<Arrayable<number>>
    ys: p.Property<Arrayable<number>>
    tension: p.Property<number>
    closed: p.Property<boolean>
  }

  export type Mixins = Line

  export type Visuals = Shape.Visuals & {line: visuals.Line}
}

export interface Spline extends Spline.Attrs {}

export class Spline extends Shape {
  declare properties: Spline.Props
  declare __view_type__: SplineView

  constructor(attrs?: Partial<Spline.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SplineView

    this.mixins<Spline.Mixins>(Line)

    this.define<Spline.Props>(({Boolean, Number, Arrayable}) => ({
      xs:      [ Arrayable(Number), [] ],
      ys:      [ Arrayable(Number), [] ],
      tension: [ Number, 0.5 ],
      closed:  [ Boolean, false ],
    }))
  }
}
