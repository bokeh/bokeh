import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import {Rect, NumberArray} from "core/types"
import {Anchor} from "core/enums"
import {Line, Fill, Hatch} from "core/visuals"
import {SpatialIndex} from "core/util/spatial"
import {Context2d} from "core/util/canvas"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_area_legend} from "./utils"
import {PointGeometry, SpanGeometry, RectGeometry} from "core/geometry"
import {Selection} from "../selections/selection"
import * as p from "core/properties"

export interface BoxData extends GlyphData {
  _right: NumberArray
  _bottom: NumberArray
  _left: NumberArray
  _top: NumberArray

  sright: NumberArray
  sbottom: NumberArray
  sleft: NumberArray
  stop: NumberArray
}

export interface BoxView extends BoxData {}

export abstract class BoxView extends GlyphView {
  model: Box
  visuals: Box.Visuals

  get_anchor_point(anchor: Anchor, i: number, _spt: [number, number]): {x: number, y: number} | null {
    const left = Math.min(this.sleft[i], this.sright[i])
    const right = Math.max(this.sright[i], this.sleft[i])
    const top = Math.min(this.stop[i], this.sbottom[i])     // screen coordinates !!!
    const bottom = Math.max(this.sbottom[i], this.stop[i])  //

    switch (anchor) {
      case "top_left":      return {x: left,             y: top             }
      case "top_center":    return {x: (left + right)/2, y: top             }
      case "top_right":     return {x: right,            y: top             }
      case "bottom_left":   return {x: left,             y: bottom          }
      case "bottom_center": return {x: (left + right)/2, y: bottom          }
      case "bottom_right":  return {x: right,            y: bottom          }
      case "center_left":   return {x: left,             y: (top + bottom)/2}
      case "center":        return {x: (left + right)/2, y: (top + bottom)/2}
      case "center_right":  return {x: right,            y: (top + bottom)/2}
      default:              return null
    }
  }

  protected abstract _lrtb(i: number): [number, number, number, number]

  protected _index_data(index: SpatialIndex): void {
    const {min, max} = Math
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const [l, r, t, b] = this._lrtb(i)
      if (isNaN(l + r + t + b) || !isFinite(l + r + t + b))
        index.add_empty()
      else
        index.add(min(l, r), min(t, b), max(r, l), max(t, b))
    }
  }

  protected _render(ctx: Context2d, indices: number[],
                    {sleft, sright, stop, sbottom}: BoxData): void {
    for (const i of indices) {
      if (isNaN(sleft[i] + stop[i] + sright[i] + sbottom[i]))
        continue

      ctx.rect(sleft[i], stop[i], sright[i] - sleft[i], sbottom[i] - stop[i])

      if (this.visuals.fill.doit) {
        this.visuals.fill.set_vectorize(ctx, i)
        ctx.beginPath()
        ctx.rect(sleft[i], stop[i], sright[i] - sleft[i], sbottom[i] - stop[i])
        ctx.fill()
      }

      this.visuals.hatch.doit2(ctx, i, () => {
        ctx.beginPath()
        ctx.rect(sleft[i], stop[i], sright[i] - sleft[i], sbottom[i] - stop[i])
        ctx.fill()
      }, () => this.renderer.request_render())

      if (this.visuals.line.doit) {
        this.visuals.line.set_vectorize(ctx, i)
        ctx.beginPath()
        ctx.rect(sleft[i], stop[i], sright[i] - sleft[i], sbottom[i] - stop[i])
        ctx.stroke()
      }

    }
  }

  // We need to clamp the endpoints inside the viewport, because various browser canvas
  // implementations have issues drawing rects with enpoints far outside the viewport
  protected _clamp_viewport(): void {
    const hr = this.renderer.plot_view.frame.bbox.h_range
    const vr = this.renderer.plot_view.frame.bbox.v_range
    const n = this.stop.length
    for (let i = 0; i < n; i++) {
      this.stop[i] = Math.max(this.stop[i], vr.start)
      this.sbottom[i] = Math.min(this.sbottom[i], vr.end)
      this.sleft[i] = Math.max(this.sleft[i], hr.start)
      this.sright[i] = Math.min(this.sright[i], hr.end)
    }
  }

  protected _hit_rect(geometry: RectGeometry): Selection {
    return this._hit_rect_against_index(geometry)
  }

  protected _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry
    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    const indices = [...this.index.indices({x0: x, y0: y, x1: x, y1: y})]
    return new Selection({indices})
  }

  protected _hit_span(geometry: SpanGeometry): Selection {
    const {sx, sy} = geometry

    let indices: number[]
    if (geometry.direction == 'v') {
      const y = this.renderer.yscale.invert(sy)
      const hr = this.renderer.plot_view.frame.bbox.h_range
      const [x0, x1] = this.renderer.xscale.r_invert(hr.start, hr.end)
      indices = [...this.index.indices({x0, y0: y, x1, y1: y})]
    } else {
      const x = this.renderer.xscale.invert(sx)
      const vr = this.renderer.plot_view.frame.bbox.v_range
      const [y0, y1] = this.renderer.yscale.r_invert(vr.start, vr.end)
      indices = [...this.index.indices({x0: x, y0, x1: x, y1})]
    }

    return new Selection({indices})
  }

  draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_area_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Box {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = Glyph.Visuals & {line: Line, fill: Fill, hatch: Hatch}
}

export interface Box extends Box.Attrs {}

export abstract class Box extends Glyph {
  properties: Box.Props
  __view_type__: BoxView

  constructor(attrs?: Partial<Box.Attrs>) {
    super(attrs)
  }

  static init_Box(): void {
    this.mixins<Box.Mixins>([LineVector, FillVector, HatchVector])
  }
}
