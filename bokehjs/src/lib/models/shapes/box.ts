import {Shape, ShapeView} from "./shape"
import {Coordinate} from "../coordinates/coordinate"
import {XY} from "../coordinates/xy"
import {Fill, Hatch, Line} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import {Anchor} from "../common/kinds"
import * as resolve from "../common/resolve"

export class BoxView extends ShapeView {
  declare model: Box
  declare visuals: Box.Visuals

  get geometry() {
    const {xy, width, height} = this.model
    const {sx, sy} = this.compute_coord(xy)
    const swidth = width
    const sheight = height
    const anchor = resolve.anchor(this.model.anchor)
    const sx0 = sx - anchor.x*swidth
    const sy0 = sy - anchor.y*sheight
    return {sx0, sy0, sx, sy, swidth, sheight, anchor}
  }

  paint(ctx: Context2d): void {
    const {sx0, sy0, swidth, sheight} = this.geometry
    if (!isFinite(sx0 + sy0 + swidth + sheight)) {
      return
    }

    ctx.beginPath()
    ctx.rect(sx0, sy0, swidth, sheight)

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)
  }
}

export namespace Box {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    xy: p.Property<Coordinate>
    width: p.Property<number>
    height: p.Property<number>
    anchor: p.Property<Anchor>
  } & Mixins

  export type Mixins = Fill & Hatch & Line

  export type Visuals = Shape.Visuals & {
    fill: visuals.Fill
    hatch: visuals.Hatch
    line: visuals.Line
  }
}

export interface Box extends Box.Attrs {}

export class Box extends Shape {
  declare properties: Box.Props
  declare __view_type__: BoxView

  constructor(attrs?: Partial<Box.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BoxView

    this.mixins<Box.Mixins>([Fill, Hatch, Line])

    this.define<Box.Props>(({Number, NonNegative, Ref}) => ({
      xy: [ Ref(Coordinate), () => new XY() ],
      width: [ NonNegative(Number), 0 ],
      height: [ NonNegative(Number), 0 ],
      anchor: [ Anchor, "center" ],
    }))
  }
}
