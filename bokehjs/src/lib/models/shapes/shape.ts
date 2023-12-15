import {Renderer, RendererView} from "../renderers/renderer"
import type {Coordinate} from "../coordinates/coordinate"
import {XY} from "../coordinates/xy"
import {Polar} from "../coordinates/polar"
import type {Scale} from "../scales/scale"
import type {Context2d} from "core/util/canvas"
import {min, max, abs, ceil, compute_angle, to_cartesian} from "core/util/math"
import {assert} from "core/util/assert"
import type * as p from "core/properties"
import {build_views} from "core/build_views"
import type {RadiusDimension} from "core/enums"
import type {ViewStorage} from "core/build_views"
import type {IterViews} from "core/view"

export type XYScale = {x_scale: Scale, y_scale: Scale}

export type SXY = {sx: number, sy: number}

export abstract class ShapeView extends RendererView {
  declare model: Shape

  get sub_renderers(): Shape[] {
    return []
  }

  protected _sub_renderers: ViewStorage<Shape> = new Map()

  override *children(): IterViews {
    yield* super.children()
    yield* this._sub_renderers.values()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await build_views(this._sub_renderers, this.sub_renderers, {parent: this})
  }

  get scales(): XYScale {
    return {
      x_scale: this.coordinates.x_scale,
      y_scale: this.coordinates.y_scale,
    }
  }

  compute_coord(coord: Coordinate): SXY {
    if (coord instanceof XY) {
      const {x, y} = coord
      const {x_scale, y_scale} = this.scales
      const sx = x_scale.compute(x)
      const sy = y_scale.compute(y)
      return {sx, sy}
    } else if (coord instanceof Polar) {
      const {origin, radius, angle, angle_units, direction} = coord
      const [x, y] = to_cartesian(radius, compute_angle(angle, angle_units, direction))
      const {sx, sy} = this.compute_coord(origin)
      return {sx: sx + x, sy: sy + y}
    } else {
      return {sx: NaN, sy: NaN}
    }
  }

  override connect_signals(): void {
    super.connect_signals()
    /*
    this.model.change.connect(() => {
      this.parent.request_paint(this)
    })
    */
  }

  protected _render(): void {
    const {ctx} = this.layer
    this.paint(ctx)
  }

  abstract paint(ctx: Context2d): void

  sdist(scale: Scale, pt: number, span: number, loc: "center" | "edge" = "edge", dilate: boolean = false): number {
    const sd = (() => {
      const compute = scale.s_compute

      switch (loc) {
        case "center": {
          const halfspan = span/2
          const spt0 = compute(pt - halfspan)
          const spt1 = compute(pt + halfspan)
          return abs(spt1 - spt0)
        }
        case "edge": {
          const spt0 = compute(pt)
          const spt1 = compute(pt + span)
          return abs(spt1 - spt0)
        }
      }
    })()

    return dilate ? ceil(sd) : sd
  }

  sradius(xy: Coordinate, radius: number, radius_dimension: RadiusDimension): number {
    const {x_scale, y_scale} = this.scales

    assert(xy instanceof XY)
    const srx = this.sdist(x_scale, xy.x, radius)
    const sry = this.sdist(y_scale, xy.y, radius)

    const sradius = (() => {
      switch (radius_dimension) {
        case "x":   return srx
        case "y":   return sry
        case "min": return min(srx, sry)
        case "max": return max(srx, sry)
      }
    })()

    return sradius
  }
}

export namespace Shape {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Renderer.Props
  export type Visuals = Renderer.Visuals
}

export interface Shape extends Shape.Attrs {}

export abstract class Shape extends Renderer {
  declare properties: Shape.Props
  declare __view_type__: ShapeView

  static override __module__ = "bokeh.models.shapes"

  constructor(attrs?: Partial<Shape.Attrs>) {
    super(attrs)
  }

  static {
    this.override<Shape.Props>({
      level: "overlay",
    })
  }
}
