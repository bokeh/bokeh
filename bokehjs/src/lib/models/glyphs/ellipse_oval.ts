import {CenterRotatable, CenterRotatableView, CenterRotatableData} from "./center_rotatable"
import {PointGeometry} from "core/geometry"
import {LineMixinVector, FillMixinVector} from "core/property_mixins"
import * as hittest from "core/hittest"
import {IBBox} from "core/util/bbox"
import {Rect} from "core/util/spatial"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"

export interface EllipseOvalData extends CenterRotatableData {}

export interface EllipseOvalView extends EllipseOvalData {}

export abstract class EllipseOvalView extends CenterRotatableView  {
  model: EllipseOval
  visuals: EllipseOval.Visuals

  protected _set_data(): void {
    this.max_w2 = 0
    if (this.model.properties.width.units == "data")
      this.max_w2 = this.max_width/2

    this.max_h2 = 0
    if (this.model.properties.height.units == "data")
      this.max_h2 = this.max_height/2
  }

  protected _map_data(): void {

    if (this.model.properties.width.units == "data")
      this.sw = this.sdist(this.renderer.xscale, this._x, this._width, 'center')
    else
      this.sw = this._width

    if (this.model.properties.height.units == "data")
      this.sh = this.sdist(this.renderer.yscale, this._y, this._height, 'center')
    else
      this.sh = this._height
  }

  protected _render(ctx: Context2d, indices: number[], {sx, sy, sw, sh, _angle}: EllipseOvalData): void {
     for (const i of indices) {
       if (isNaN(sx[i] + sy[i] + sw[i] + sh[i] + _angle[i]))
         continue

       ctx.beginPath()
       ctx.ellipse(sx[i], sy[i], sw[i]/2.0, sh[i]/2.0, _angle[i], 0, 2 * Math.PI)

       if (this.visuals.fill.doit) {
         this.visuals.fill.set_vectorize(ctx, i)
         ctx.fill()
       }

       if (this.visuals.line.doit) {
         this.visuals.line.set_vectorize(ctx, i)
         ctx.stroke()
       }
     }
   }

  protected _hit_point(geometry: PointGeometry): Selection {
    let x0, x1, y0, y1, cond, dist, sx0, sx1, sy0, sy1

    const {sx, sy} = geometry
    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    if (this.model.properties.width.units == "data"){
      x0 = x - this.max_width
      x1 = x + this.max_width
    }
    else{
      sx0 = sx - this.max_width
      sx1 = sx + this.max_width
      ;[x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
    }
    if (this.model.properties.height.units == "data"){
      y0 = y - this.max_height
      y1 = y + this.max_height
    }
    else{
      sy0 = sy - this.max_height
      sy1 = sy + this.max_height
      ;[y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
    }

    const bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    const candidates = this.index.indices(bbox)
    const hits: [number, number][] = []

    for (const i of candidates) {
      cond = hittest.point_in_ellipse(sx, sy, this._angle[i], this.sh[i]/2, this.sw[i]/2, this.sx[i], this.sy[i])
      if (cond){
        ;[sx0, sx1] = this.renderer.xscale.r_compute(x, this._x[i])
        ;[sy0, sy1] = this.renderer.yscale.r_compute(y, this._y[i])
        dist = Math.pow(sx0-sx1, 2) + Math.pow(sy0-sy1, 2)
        hits.push([i, dist])
      }
    }

    return hittest.create_hit_test_result_from_hits(hits)
  }

  draw_legend_for_index(ctx: Context2d, {x0, y0, x1, y1}: IBBox, index: number): void {
    const len = index + 1

    const sx: number[] = new Array(len)
    sx[index] = (x0 + x1)/2
    const sy: number[] = new Array(len)
    sy[index] = (y0 + y1)/2

    const scale = this.sw[index] / this.sh[index]
    const d = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0))*0.8

    const sw: number[] = new Array(len)
    const sh: number[] = new Array(len)
    if (scale > 1) {
      sw[index] = d
      sh[index] = d/scale
    } else {
      sw[index] = d*scale
      sh[index] = d
    }

    this._render(ctx, [index], {sx, sy, sw, sh, _angle: [0]} as any) // XXX
  }

  protected _bounds({minX, maxX, minY, maxY}: Rect): Rect {
    return {
      minX: minX - this.max_w2,
      maxX: maxX + this.max_w2,
      minY: minY - this.max_h2,
      maxY: maxY + this.max_h2,
    }
  }
}

export namespace EllipseOval {
  export interface Mixins extends LineMixinVector, FillMixinVector {}

  export interface Attrs extends CenterRotatable.Attrs, Mixins {}

  export interface Props extends CenterRotatable.Props {}

  export interface Visuals extends CenterRotatable.Visuals {}
}

export interface EllipseOval extends EllipseOval.Attrs {}

export abstract class EllipseOval extends CenterRotatable {

  properties: EllipseOval.Props

  constructor(attrs?: Partial<EllipseOval.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'EllipseOval'
  }
}
EllipseOval.initClass()
