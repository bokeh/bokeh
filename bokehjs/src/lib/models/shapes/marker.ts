import {Shape, ShapeView} from "./shape"
import {Coordinate} from "../coordinates/coordinate"
import {XY} from "../coordinates/xy"
import type {ScalarVisual, VectorVisual, VectorVisuals} from "../glyphs/defs"
import {v_marker_funcs} from "../glyphs/defs"
import {Fill, Hatch, Line} from "core/property_mixins"
import {AngleUnits, Direction, MarkerType} from "core/enums"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import {compute_angle} from "core/util/math"

export class MarkerView extends ShapeView {
  declare model: Marker
  declare visuals: Marker.Visuals

  private get v_visuals(): VectorVisuals {
    function adapter(visual: ScalarVisual): VectorVisual {
      return {
        apply(ctx, _i) { visual.apply(ctx) },
        set_vectorize(ctx, _i) { visual.set_value(ctx) },
      }
    }

    const {fill, hatch, line} = this.visuals
    const visuals = {
      fill: adapter(fill),
      hatch: adapter(hatch),
      line: adapter(line),
    }

    return visuals
  }

  get angle(): number {
    const {angle, angle_units, direction} = this.model
    return compute_angle(angle, angle_units, direction)
  }

  get geometry() {
    const {xy, size, marker} = this.model
    const {sx, sy} = this.compute_coord(xy)
    const {angle} = this
    return {sx, sy, size, angle, marker}
  }

  paint(ctx: Context2d): void {
    const {sx, sy, size, angle, marker} = this.geometry
    if (!isFinite(sx + sy + size + angle)) {
      return
    }

    ctx.beginPath()
    ctx.translate(sx, sy)
    ctx.rotate(angle)

    v_marker_funcs[marker](ctx, 0, size/2, this.v_visuals)

    ctx.rotate(-angle)
    ctx.translate(-sx, -sy)
  }
}

export namespace Marker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    xy: p.Property<Coordinate>
    size: p.Property<number>
    angle: p.Property<number>
    angle_units: p.Property<AngleUnits>
    direction: p.Property<Direction>
    marker: p.Property<MarkerType>
  } & Mixins

  export type Mixins = Fill & Hatch & Line

  export type Visuals = Shape.Visuals & {
    fill: visuals.Fill
    hatch: visuals.Hatch
    line: visuals.Line
  }
}

export interface Marker extends Marker.Attrs {}

export class Marker extends Shape {
  declare properties: Marker.Props
  declare __view_type__: MarkerView

  constructor(attrs?: Partial<Marker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = MarkerView

    this.mixins<Marker.Mixins>([Fill, Hatch, Line])

    this.define<Marker.Props>(({Number, NonNegative, Ref, Angle}) => ({
      xy: [ Ref(Coordinate), () => new XY() ],
      size: [ NonNegative(Number), 5 ],
      angle: [ Angle, 0 ],
      angle_units: [ AngleUnits, "rad" ],
      direction: [ Direction, "anticlock" ],
      marker: [ MarkerType, "circle" ],
    }))
  }
}
