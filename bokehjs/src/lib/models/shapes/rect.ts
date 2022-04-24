import {Shape, ShapeView} from "./shape"
import {Coordinate, XY} from "../coordinates"
import {Scale} from "../scales/scale"
import {AngleUnits, Direction} from "core/enums"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"
import {assert} from "core/util/assert"

export class RectView extends ShapeView {
  override model: Rect
  override visuals: Rect.Visuals

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

  get geometry(): {sx: number, sy: number} {
    const {center} = this.model
    assert(center instanceof XY)
    const sx = this.x_coordinates(center).compute(center.x)
    const sy = this.y_coordinates(center).compute(center.y)
    // TODO
    return {sx, sy}
  }

  paint(ctx: Context2d): void {
    ctx.beginPath()

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)
  }
}

export namespace Rect {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    center: p.Property<Coordinate>
    width: p.Property<number>
    height: p.Property<number>
    angle: p.Property<number>
    angle_units: p.Property<AngleUnits>
    direction: p.Property<Direction>
  } & Mixins

  export type Mixins = mixins.Line & mixins.Fill & mixins.Hatch

  export type Visuals = Shape.Visuals & {
    line: visuals.Line
    fill: visuals.Fill
    hatch: visuals.Hatch
  }
}

export interface Rect extends Rect.Attrs {}

export class Rect extends Shape {
  override properties: Rect.Props
  override __view_type__: RectView

  constructor(attrs?: Partial<Rect.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = RectView

    this.mixins<Rect.Mixins>([
      mixins.Line,
      mixins.Fill,
      mixins.Hatch,
    ])

    this.define<Rect.Props>(({Number, NonNegative, Ref}) => ({
      center:      [ Ref(Coordinate) ],
      width:       [ NonNegative(Number) ],
      height:      [ NonNegative(Number) ],
      angle_units: [ AngleUnits, "rad" ],
      direction:   [ Direction, "anticlock" ],
    }))
  }
}
