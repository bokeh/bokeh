import {RadialGlyph, RadialGlyphView} from "./radial_glyph"
import type {PointGeometry, PolyGeometry, RectGeometry, SpanGeometry} from "core/geometry"
import {minmax2} from "core/util/arrayable"
import {edge_intersection, point_in_poly, vertex_overlap} from "core/hittest"
import * as p from "core/properties"
import type {Arrayable} from "core/types"
import type {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"

export interface NgonView extends Ngon.Data {}

function ngon(x: number, y: number, r: number, n: number, angle: number): [Arrayable<number>, Arrayable<number>]  {
  const xs = new Float32Array(n)
  const ys = new Float32Array(n)
  const alpha_i = 2*Math.PI / n
  for (let i = 0; i < n; i++) {
    const alpha = i * alpha_i + angle
    xs[i] = x + r * Math.sin(alpha)
    ys[i] = y + r * -Math.cos(alpha)
  }
  return [xs, ys]
}

export class NgonView extends RadialGlyphView {
  declare model: Ngon
  declare visuals: Ngon.Visuals

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<Ngon.Data>): void {
    const {sx, sy, sradius, angle, n} = {...this, ...data}

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const sradius_i = sradius[i]
      const angle_i = angle.get(i)
      const n_i = n.get(i)

      if (n_i < 3 || !isFinite(sx_i + sy_i + sradius_i + angle_i + n_i)) {
        continue
      }

      const [sxs, sys] = ngon(sx_i, sy_i, sradius_i, n_i, angle_i)

      ctx.beginPath()
      ctx.moveTo(sxs[0], sys[0])
      for (let i = 1; i <= n_i; i++) {
        ctx.lineTo(sxs[i], sys[i])
      }
      ctx.closePath()

      this.visuals.fill.apply(ctx, i)
      this.visuals.hatch.apply(ctx, i)
      this.visuals.line.apply(ctx, i)
    }
  }

  protected _ngon(index: number) {
    const {sx, sy, sradius, angle, n} = {...this}
    const sx_i = sx[index]
    const sy_i = sy[index]
    const sradius_i = sradius[index]
    const angle_i = angle.get(index)
    const n_i = n.get(index)
    return ngon(sx_i, sy_i, sradius_i, n_i, angle_i)
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const x = this.renderer.xscale.invert(geometry.sx)
    const y = this.renderer.yscale.invert(geometry.sy)
    const candidates = this.index.indices({x0: x, y0: y, x1: x, y1: y})

    const indices = []
    for (const index of candidates) {
      const [sxs, sys] = this._ngon(index)
      if (point_in_poly(geometry.sx, geometry.sy, sxs, sys)) {
        indices.push(index)
      }
    }
    return new Selection({indices})
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const {sx, sy} = geometry
    const {x0, x1, y0, y1} = this.bounds()

    const [val, dim, candidates] = (() => {
      switch (geometry.direction) {
        case "v": {
          const y = this.renderer.yscale.invert(sy)
          const candidates = this.index.indices({x0, y0: y, x1, y1: y})
          return [sy, 1, candidates]
        }
        case "h": {
          const x = this.renderer.xscale.invert(sx)
          const candidates = this.index.indices({x0: x, y0, x1: x, y1})
          return [sx, 0, candidates]
        }
      }
    })()

    const indices = []
    for (const index of candidates) {
      const coords = this._ngon(index)[dim]
      for (let i = 0; i < coords.length-1; i++) {
        if ((coords[i] <= val && val <= coords[i+1]) || (coords[i+1] <= val && val <= coords[i])) {
          indices.push(index)
          break
        }
      }
    }
    return new Selection({indices})
  }
  protected override _hit_poly(geometry: PolyGeometry): Selection {
    const {sx: gsx, sy: gsy} = geometry

    const candidates = (() => {
      const xs = this.renderer.xscale.v_invert(gsx)
      const ys = this.renderer.yscale.v_invert(gsy)
      const [x0, x1, y0, y1] = minmax2(xs, ys)
      return this.index.indices({x0, x1, y0, y1})
    })()

    const indices = []
    for (const index of candidates) {
      const [sxs, sys] = this._ngon(index)
      if (vertex_overlap(sxs, sys, gsx, gsy)) {
        indices.push(index)
        continue
      }
      if (edge_intersection(sxs, sys, gsx, gsy)) {
        indices.push(index)
        continue
      }
    }

    return new Selection({indices})
  }

  protected override _hit_rect(geometry: RectGeometry): Selection {
    const {sx0, sx1, sy0, sy1} = geometry
    const sxs = [sx0, sx1, sx1, sx0]
    const sys = [sy0, sy0, sy1, sy1]
    return this._hit_poly({type: "poly", sx: sxs, sy: sys})
  }
}

export namespace Ngon {
  export type Attrs = p.AttrsOf<Props>

  export type Props = RadialGlyph.Props & {
    angle: p.AngleSpec
    n: p.NumberSpec
  }

  export type Visuals = RadialGlyph.Visuals

  export type Data = p.GlyphDataOf<Props>
}

export interface Ngon extends Ngon.Attrs {}

export class Ngon extends RadialGlyph {
  declare properties: Ngon.Props
  declare __view_type__: NgonView

  constructor(attrs?: Partial<Ngon.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = NgonView

    this.define<Ngon.Props>(() => ({
      angle: [ p.AngleSpec, 0 ],
      n:     [ p.NumberSpec, {field: "n"} ],
    }))
  }
}
