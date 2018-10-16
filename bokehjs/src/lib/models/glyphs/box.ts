import {LineMixinVector, FillMixinVector} from "core/property_mixins"
import {Arrayable} from "core/types"
import {Line, Fill} from "core/visuals"
import {IBBox} from "core/util/bbox"
import {SpatialIndex} from "core/util/spatial"
import {Context2d} from "core/util/canvas"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_area_legend} from "./utils"
import {PointGeometry, SpanGeometry, RectGeometry} from "core/geometry"
import * as hittest from "core/hittest"
import {Selection} from "../selections/selection"

export interface BoxData extends GlyphData {
  _right: Arrayable<number>
  _bottom: Arrayable<number>
  _left: Arrayable<number>
  _top: Arrayable<number>

  sright: Arrayable<number>
  sbottom: Arrayable<number>
  sleft: Arrayable<number>
  stop: Arrayable<number>
}

export interface BoxView extends BoxData {}

export abstract class BoxView extends GlyphView {
  model: Box
  visuals: Box.Visuals

  protected abstract _lrtb(i: number): [number, number, number, number]

  protected _index_box(len: number): SpatialIndex {
    const points = []

    for (let i = 0; i < len; i++) {
      const [l, r, t, b] = this._lrtb(i)
      if (isNaN(l + r + t + b) || !isFinite(l + r + t + b))
        continue
      points.push({
        minX: Math.min(l, r),
        minY: Math.min(t, b),
        maxX: Math.max(r, l),
        maxY: Math.max(t, b),
        i,
      })
    }

    return new SpatialIndex(points)
  }

  protected _render(ctx: Context2d, indices: number[],
                    {sleft, sright, stop, sbottom}: BoxData): void {
    for (const i of indices) {
      if (isNaN(sleft[i] + stop[i] + sright[i] + sbottom[i]))
        continue

      if (this.visuals.fill.doit) {
        this.visuals.fill.set_vectorize(ctx, i)
        ctx.fillRect(sleft[i], stop[i], sright[i] - sleft[i], sbottom[i] - stop[i])
      }

      if (this.visuals.line.doit) {
        ctx.beginPath()
        ctx.rect(sleft[i], stop[i], sright[i] - sleft[i], sbottom[i] - stop[i])
        this.visuals.line.set_vectorize(ctx, i)
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

    const hits = this.index.indices({minX: x, minY: y, maxX: x, maxY: y})

    const result = hittest.create_empty_hit_test_result()
    result.indices = hits
    return result
  }

  protected _hit_span(geometry: SpanGeometry): Selection {
    const {sx, sy} = geometry

    let hits: number[]
    if (geometry.direction == 'v') {
      const y = this.renderer.yscale.invert(sy)
      const hr = this.renderer.plot_view.frame.bbox.h_range
      const [minX, maxX] = this.renderer.xscale.r_invert(hr.start, hr.end)
      hits = this.index.indices({minX, minY: y, maxX, maxY: y})
    } else {
      const x = this.renderer.xscale.invert(sx)
      const vr = this.renderer.plot_view.frame.bbox.v_range
      const [minY, maxY] = this.renderer.yscale.r_invert(vr.start, vr.end)
      hits = this.index.indices({minX: x, minY, maxX: x, maxY})
    }

    const result = hittest.create_empty_hit_test_result()
    result.indices = hits
    return result
  }

  draw_legend_for_index(ctx: Context2d, bbox: IBBox, index: number): void {
    generic_area_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Box {
  export interface Mixins extends LineMixinVector, FillMixinVector {}

  export interface Attrs extends Glyph.Attrs, Mixins {}

  export interface Props extends Glyph.Props {}

  export interface Visuals extends Glyph.Visuals {
    line: Line
    fill: Fill
  }
}

export interface Box extends Box.Attrs {}

export abstract class Box extends Glyph {

  properties: Box.Props

  constructor(attrs?: Partial<Box.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Box"

    this.mixins(['line', 'fill'])
  }
}
Box.initClass()
