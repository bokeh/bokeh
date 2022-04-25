import {Renderer, RendererView} from "../renderers/renderer"
import {Scale} from "../scales/scale"
import {Context2d} from "core/util/canvas"
import {abs, ceil} from "core/util/math"
import * as p from "core/properties"

export type Geometry = {}

export abstract class ShapeView extends RendererView {
  override model: Shape

  protected _render(): void {
    const {ctx} = this.layer
    this.paint(ctx)
  }

  abstract get geometry(): Geometry

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
}

export namespace Shape {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Renderer.Props
  export type Visuals = Renderer.Visuals
}

export interface Shape extends Shape.Attrs {}

export abstract class Shape extends Renderer {
  override properties: Shape.Props
  override __view_type__: ShapeView

  static override __module__ = "bokeh.models.shapes"

  constructor(attrs?: Partial<Shape.Attrs>) {
    super(attrs)
  }

  static {
    this.override<Shape.Props>({
      level: "annotation",
    })
  }
}
