import {Shape, ShapeView} from "./shape"
import {Scale} from "../scales/scale"
import {Seq} from "core/types"
import {Line} from "core/property_mixins"
import {CoordinateUnits} from "core/enums"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"
import {catmullrom_spline} from "core/util/interpolation"
import {zip} from "core/util/iterator"

export class SplineView extends ShapeView {
  override model: Spline
  override visuals: Spline.Visuals

  get xs_coordinates(): Scale {
    switch (this.model.xs_units) {
      case "canvas": return this.canvas.screen.x_scale
      case "screen": return this.parent.view.x_scale
      case "data":   return this.coordinates.x_scale
    }
  }

  get ys_coordinates(): Scale {
    switch (this.model.ys_units) {
      case "canvas": return this.canvas.screen.y_scale
      case "screen": return this.parent.view.y_scale
      case "data":   return this.coordinates.y_scale
    }
  }

  get geometry() {
    const {xs, ys, tension, closed} = this.model
    const [xst, yst] = catmullrom_spline(xs, ys, 20, tension, closed)

    const {xs_coordinates, ys_coordinates} = this
    return {
      sxs: xs_coordinates.v_compute(xs),
      sys: ys_coordinates.v_compute(ys),
      sxst: xs_coordinates.v_compute(xst),
      syst: ys_coordinates.v_compute(yst),
    }
  }

  paint(ctx: Context2d): void {
    const {sxst, syst} = this.geometry

    ctx.beginPath()
    for (const [sx, sy] of zip(sxst, syst)) {
      ctx.lineTo(sx, sy)
    }

    this.visuals.line.apply(ctx)
  }
}

export namespace Spline {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & Mixins & {
    xs: p.Property<Seq<number>>
    ys: p.Property<Seq<number>>
    xs_units: p.Property<CoordinateUnits>
    ys_units: p.Property<CoordinateUnits>
    tension: p.Property<number>
    closed: p.Property<boolean>
  }

  export type Mixins = Line

  export type Visuals = Shape.Visuals & {line: visuals.Line}
}

export interface Spline extends Spline.Attrs {}

export class Spline extends Shape {
  override properties: Spline.Props
  override __view_type__: SplineView

  constructor(attrs?: Partial<Spline.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SplineView

    this.mixins<Spline.Mixins>(Line)

    this.define<Spline.Props>(({Boolean, Number, Seq}) => ({
      xs:       [ Seq(Number), [] ],
      ys:       [ Seq(Number), [] ],
      xs_units: [ CoordinateUnits, "data" ],
      ys_units: [ CoordinateUnits, "data" ],
      tension:  [ Number, 0.5   ],
      closed:   [ Boolean, false ],
    }))
  }
}
