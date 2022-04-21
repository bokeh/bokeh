import {Shape, ShapeView} from "./shape"
import {Scale} from "../scales/scale"
import {Line} from "core/property_mixins"
import {CoordinateUnits} from "core/enums"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"

export class BezierView extends ShapeView {
  override model: Bezier
  override visuals: Bezier.Visuals

  get x_coordinates(): Scale {
    switch (this.model.x_units) {
      case "canvas": return this.canvas.screen.x_scale
      case "screen": return this.parent.view.x_scale
      case "data":   return this.coordinates.x_scale
    }
  }

  get y_coordinates(): Scale {
    switch (this.model.y_units) {
      case "canvas": return this.canvas.screen.y_scale
      case "screen": return this.parent.view.y_scale
      case "data":   return this.coordinates.y_scale
    }
  }

  get geometry() {
    const {x0, y0, x1, y1, cx0, cy0, cx1, cy1} = this.model
    const {x_coordinates, y_coordinates} = this

    return {
      sx0: x_coordinates.compute(x0),
      sy0: y_coordinates.compute(y0),
      sx1: x_coordinates.compute(x1),
      sy1: y_coordinates.compute(y1),
      scx0: x_coordinates.compute(cx0),
      scy0: y_coordinates.compute(cy0),
      scx1: cx1 != null ? x_coordinates.compute(cx1) : null,
      scy1: cy1 != null ? y_coordinates.compute(cy1) : null,
    }
  }

  paint(ctx: Context2d): void {
    const {sx0, sy0, sx1, sy1, scx0, scy0, scx1, scy1} = this.geometry
    if (!isFinite(sx0 + sy0 + sx1 + sy1 + scx0 + scy0 + (scx1 ?? 0) + (scy1 ?? 0)))
      return

    ctx.beginPath()
    ctx.moveTo(sx0, sy0)

    if (scx1 != null && scy1 != null)
      ctx.bezierCurveTo(scx0, scy0, scx1, scy1, sx1, sy1)
    else
      ctx.quadraticCurveTo(scx0, scy0, sx1, sy1)

    this.visuals.line.apply(ctx)
  }
}

export namespace Bezier {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    x0: p.Property<number>
    y0: p.Property<number>
    x1: p.Property<number>
    y1: p.Property<number>
    cx0: p.Property<number>
    cy0: p.Property<number>
    cx1: p.Property<number | null>
    cy1: p.Property<number | null>
    x_units: p.Property<CoordinateUnits>
    y_units: p.Property<CoordinateUnits>
  } & Mixins

  export type Mixins = Line

  export type Visuals = Shape.Visuals & {line: visuals.Line}
}

export interface Bezier extends Bezier.Attrs {}

export class Bezier extends Shape {
  override properties: Bezier.Props
  override __view_type__: BezierView

  constructor(attrs?: Partial<Bezier.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BezierView

    this.mixins<Bezier.Mixins>(Line)

    this.define<Bezier.Props>(({Number, Nullable}) => ({
      x0:      [ Number ],
      y0:      [ Number ],
      x1:      [ Number ],
      y1:      [ Number ],
      cx0:     [ Number ],
      cy0:     [ Number ],
      cx1:     [ Nullable(Number), null ],
      cy1:     [ Nullable(Number), null ],
      x_units: [ CoordinateUnits, "data" ],
      y_units: [ CoordinateUnits, "data" ],
    }))
  }
}
