import {Shape, ShapeView} from "./shape"
import {Coordinate, XY} from "../coordinates"
import {Scale} from "../scales/scale"
import {Line} from "core/property_mixins"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {assert} from "core/util/assert"
import {Context2d} from "core/util/canvas"

export class BezierView extends ShapeView {
  override model: Bezier
  override visuals: Bezier.Visuals

  x_coordinates(coord: XY): Scale {
    switch (coord.x_units) {
      case "canvas": return this.canvas.screen.x_scale
      case "screen": return this.parent.view.x_scale
      case "data":   return this.coordinates.x_scale
    }
  }

  y_coordinates(coord: XY): Scale {
    switch (coord.y_units) {
      case "canvas": return this.canvas.screen.y_scale
      case "screen": return this.parent.view.y_scale
      case "data":   return this.coordinates.y_scale
    }
  }

  get geometry() {
    const {p0, p1, cp0, cp1} = this.model

    assert(p0 instanceof XY)
    assert(p1 instanceof XY)
    assert(cp0 instanceof XY)
    assert(cp1 == null || cp1 instanceof XY)

    return {
      sx0: this.x_coordinates(p0).compute(p0.x),
      sy0: this.y_coordinates(p0).compute(p0.y),
      sx1: this.x_coordinates(p1).compute(p1.x),
      sy1: this.y_coordinates(p1).compute(p1.y),
      scx0: this.x_coordinates(cp0).compute(cp0.x),
      scy0: this.y_coordinates(cp0).compute(cp0.y),
      scx1: cp1 != null ? this.x_coordinates(cp1).compute(cp1.x) : null,
      scy1: cp1 != null ? this.y_coordinates(cp1).compute(cp1.y) : null,
    }
  }

  paint(ctx: Context2d): void {
    const {sx0, sy0, sx1, sy1, scx0, scy0, scx1, scy1} = this.geometry

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
    p0: p.Property<Coordinate>
    p1: p.Property<Coordinate>
    cp0: p.Property<Coordinate>
    cp1: p.Property<Coordinate | null>
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

    this.define<Bezier.Props>(({Nullable, Ref}) => ({
      p0:  [ Ref(Coordinate) ],
      p1:  [ Ref(Coordinate) ],
      cp0: [ Ref(Coordinate) ],
      cp1: [ Nullable(Ref(Coordinate)),  null],
    }))
  }
}
