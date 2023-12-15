import {Shape, ShapeView} from "./shape"
import {Coordinate} from "../coordinates/coordinate"
import {XY} from "../coordinates/xy"
import {Line} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"

export class BezierView extends ShapeView {
  declare model: Bezier
  declare visuals: Bezier.Visuals

  get geometry() {
    const {xy0, xy1, cxy0, cxy1} = this.model

    const {sx: sx0, sy: sy0} = this.compute_coord(xy0)
    const {sx: sx1, sy: sy1} = this.compute_coord(xy1)
    const {sx: scx0, sy: scy0} = this.compute_coord(cxy0)
    const {sx: scx1, sy: scy1} = cxy1 != null ? this.compute_coord(cxy1) : {sx: NaN, sy: NaN}

    return {sx0, sy0, sx1, sy1, scx0, scy0, scx1, scy1}
  }

  paint(ctx: Context2d): void {
    const {sx0, sy0, sx1, sy1, scx0, scy0, scx1, scy1} = this.geometry
    if (!isFinite(sx0 + sy0 + sx1 + sy1 + scx0 + scy0)) {
      return
    }

    ctx.beginPath()
    ctx.moveTo(sx0, sy0)

    if (isFinite(scx1) && isFinite(scy1)) {
      ctx.bezierCurveTo(scx0, scy0, scx1, scy1, sx1, sy1)
    } else {
      ctx.quadraticCurveTo(scx0, scy0, sx1, sy1)
    }

    this.visuals.line.apply(ctx)
  }
}

export namespace Bezier {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    xy0: p.Property<Coordinate>
    xy1: p.Property<Coordinate>
    cxy0: p.Property<Coordinate>
    cxy1: p.Property<Coordinate | null>
  } & Mixins

  export type Mixins = Line

  export type Visuals = Shape.Visuals & {line: visuals.Line}
}

export interface Bezier extends Bezier.Attrs {}

export class Bezier extends Shape {
  declare properties: Bezier.Props
  declare __view_type__: BezierView

  constructor(attrs?: Partial<Bezier.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BezierView

    this.mixins<Bezier.Mixins>(Line)

    this.define<Bezier.Props>(({Nullable, Ref}) => ({
      xy0: [ Ref(Coordinate), () => new XY() ],
      xy1: [ Ref(Coordinate), () => new XY() ],
      cxy0: [ Ref(Coordinate), () => new XY() ],
      cxy1: [ Nullable(Ref(Coordinate)), null ],
    }))
  }
}
