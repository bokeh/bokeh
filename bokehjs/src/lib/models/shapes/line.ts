import {Shape, ShapeView} from "./shape"
import {Coordinate, XY} from "../coordinates"
import {Scale} from "../scales/scale"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {assert} from "core/util/assert"
import {Context2d} from "core/util/canvas"

type Geometry = {
  sx0: number
  sy0: number
  sx1: number
  sy1: number
}

export class LineView extends ShapeView {
  override model: Line
  override visuals: Line.Visuals

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

  get geometry(): Geometry {
    const p0 = this.resolve(this.model.p0)
    const p1 = this.resolve(this.model.p1)

    assert(p0 instanceof XY)
    assert(p1 instanceof XY)

    return {
      sx0: this.x_coordinates(p0).compute(p0.x),
      sy0: this.y_coordinates(p0).compute(p0.y),
      sx1: this.x_coordinates(p1).compute(p1.x),
      sy1: this.y_coordinates(p1).compute(p1.y),
    }
  }

  paint(ctx: Context2d): void {
    const {sx0, sy0, sx1, sy1} = this.geometry

    ctx.beginPath()
    ctx.moveTo(sx0, sy0)
    ctx.lineTo(sx1, sy1)

    this.visuals.line.apply(ctx)
  }
}

export namespace Line {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & Mixins & {
    p0: p.Property<Coordinate>
    p1: p.Property<Coordinate>
  }

  export type Mixins = mixins.Line

  export type Visuals = Shape.Visuals & {line: visuals.Line}
}

export interface Line extends Line.Attrs {}

export class Line extends Shape {
  override properties: Line.Props
  override __view_type__: LineView

  constructor(attrs?: Partial<Line.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LineView

    this.mixins<Line.Mixins>(mixins.Line)

    this.define<Line.Props>(({Ref}) => ({
      p0: [ Ref(Coordinate) ],
      p1: [ Ref(Coordinate) ],
    }))
  }
}
