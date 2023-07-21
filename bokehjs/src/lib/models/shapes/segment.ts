import {Shape, ShapeView} from "./shape"
import {Coordinate} from "../coordinates/coordinate"
import {XY} from "../coordinates/xy"
import {Line} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"

export class SegmentView extends ShapeView {
  declare model: Segment
  declare visuals: Segment.Visuals

  get geometry() {
    const {xy0, xy1} = this.model
    const {sx: sx0, sy: sy0} = this.compute_coord(xy0)
    const {sx: sx1, sy: sy1} = this.compute_coord(xy1)
    return {sx0, sy0, sx1, sy1}
  }

  paint(ctx: Context2d): void {
    const {sx0, sy0, sx1, sy1} = this.geometry
    if (!isFinite(sx0 + sy0 + sx1 + sy1)) {
      return
    }

    ctx.beginPath()
    ctx.moveTo(sx0, sy0)
    ctx.lineTo(sx1, sy1)

    this.visuals.line.apply(ctx)
  }
}

export namespace Segment {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    xy0: p.Property<Coordinate>
    xy1: p.Property<Coordinate>
  } & Mixins

  export type Mixins = Line

  export type Visuals = Shape.Visuals & {
    line: visuals.Line
  }
}

export interface Segment extends Segment.Attrs {}

export class Segment extends Shape {
  declare properties: Segment.Props
  declare __view_type__: SegmentView

  constructor(attrs?: Partial<Segment.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SegmentView

    this.mixins<Segment.Mixins>(Line)

    this.define<Segment.Props>(({Ref}) => ({
      xy0: [ Ref(Coordinate), () => new XY() ],
      xy1: [ Ref(Coordinate), () => new XY() ],
    }))
  }
}
