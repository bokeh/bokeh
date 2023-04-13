import {Glyph, GlyphView, GlyphData} from "./glyph"

import {PointGeometry, RectGeometry, SpanGeometry} from "core/geometry"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import {Rect, FloatArray, ScreenArray} from "core/types"
import {Context2d} from "core/util/canvas"
import {SpatialIndex} from "core/util/spatial"
import * as visuals from "core/visuals"
import {HexTileOrientation} from "core/enums"
import {inplace} from "core/util/projections"

import {generic_area_vector_legend} from "./utils"
import {Selection} from "../selections/selection"

export type Vertices = [number, number, number, number, number, number]

export type HexTileData = GlyphData & p.UniformsOf<HexTile.Mixins> & {
  readonly q: p.Uniform<number>
  readonly r: p.Uniform<number>

  _x: FloatArray
  _y: FloatArray

  readonly scale: p.Uniform<number>

  sx: ScreenArray
  sy: ScreenArray

  svx: Vertices
  svy: Vertices
}

export interface HexTileView extends HexTileData {}

export class HexTileView extends GlyphView {
  declare model: HexTile
  declare visuals: HexTile.Visuals

  /** @internal */
  declare glglyph?: import("./webgl/hex_tile").HexTileGL

  override async load_glglyph() {
    const {HexTileGL} = await import("./webgl/hex_tile")
    return HexTileGL
  }

  scenterxy(i: number): [number, number] {
    const scx = this.sx[i]
    const scy = this.sy[i]
    return [scx, scy]
  }

  protected override _set_data(): void {
    const {orientation, size, aspect_scale} = this.model
    const {q, r} = this

    const n = this.q.length
    this._x = new Float64Array(n)
    this._y = new Float64Array(n)
    const {_x, _y} = this

    const sqrt3 = Math.sqrt(3)
    if (orientation == "pointytop") {
      for (let i = 0; i < n; i++) {
        const q_i = q.get(i)
        const r2_i = r.get(i)/2
        _x[i] = size*sqrt3*(q_i + r2_i)/aspect_scale
        _y[i] = -3*size*r2_i
      }
    } else {
      for (let i = 0; i < n; i++) {
        const q2_i = q.get(i)/2
        const r_i = r.get(i)
        _x[i] = 3*size*q2_i
        _y[i] = -size*sqrt3*(r_i + q2_i)*aspect_scale
      }
    }
  }

  protected override _project_data(): void {
    inplace.project_xy(this._x, this._y)
  }

  protected _index_data(index: SpatialIndex): void {
    let ysize = this.model.size
    let xsize = Math.sqrt(3)*ysize/2

    if (this.model.orientation == "flattop") {
      [xsize, ysize] = [ysize, xsize]
      ysize *= this.model.aspect_scale
    } else
      xsize /= this.model.aspect_scale

    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const x = this._x[i]
      const y = this._y[i]
      index.add_rect(x - xsize, y - ysize, x + xsize, y + ysize)
    }
  }

  // overriding map_data instead of _map_data because the default automatic mappings
  // for other glyphs (with cartesian coordinates) is not useful
  override map_data(): void {
    [this.sx, this.sy] = this.renderer.coordinates.map_to_screen(this._x, this._y)
    ;[this.svx, this.svy] = this._get_unscaled_vertices()

    // From overridden GlyphView.map_data()
    this.glglyph?.set_data_changed()
  }

  protected _get_unscaled_vertices(): [[number, number, number, number, number, number], [number, number, number, number, number, number]] {
    const size = this.model.size
    const aspect_scale = this.model.aspect_scale

    if (this.model.orientation == "pointytop") {
      const rscale = this.renderer.yscale
      const hscale = this.renderer.xscale

      const r = Math.abs(rscale.compute(0) - rscale.compute(size))                               // assumes linear scale
      const h = Math.sqrt(3)/2*Math.abs(hscale.compute(0) - hscale.compute(size)) / aspect_scale // assumes linear scale
      const r2 = r/2.0

      const svx: Vertices = [0, -h,  -h,   0,  h,  h ]
      const svy: Vertices = [r,  r2, -r2, -r, -r2, r2]

      return [svx, svy]
    } else {
      const rscale = this.renderer.xscale
      const hscale = this.renderer.yscale

      const r = Math.abs(rscale.compute(0) - rscale.compute(size))                               // assumes linear scale
      const h = Math.sqrt(3)/2*Math.abs(hscale.compute(0) - hscale.compute(size)) * aspect_scale // assumes linear scale
      const r2 = r/2.0

      const svx: Vertices = [r,  r2, -r2, -r, -r2, r2]
      const svy: Vertices = [0, -h,  -h,   0,  h,  h ]

      return [svx, svy]
    }
  }

  protected _render(ctx: Context2d, indices: number[], data?: HexTileData): void {
    const {sx, sy, svx, svy, scale} = data ?? this

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const scale_i = scale.get(i)

      if (!isFinite(sx_i + sy_i + scale_i))
        continue

      ctx.translate(sx_i, sy_i)
      ctx.beginPath()
      for (let j = 0; j < 6; j++) {
        ctx.lineTo(svx[j]*scale_i, svy[j]*scale_i)
      }
      ctx.closePath()
      ctx.translate(-sx_i, -sy_i)

      this.visuals.fill.apply(ctx, i)
      this.visuals.hatch.apply(ctx, i)
      this.visuals.line.apply(ctx, i)
    }
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry
    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    const candidates = this.index.indices({x0: x, y0: y, x1: x, y1: y})
    const indices = []

    for (const i of candidates) {
      if (hittest.point_in_poly(sx-this.sx[i], sy-this.sy[i], this.svx, this.svy)) {
        indices.push(i)
      }
    }

    return new Selection({indices})
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const {sx, sy} = geometry

    let indices: number[]
    if (geometry.direction == "v") {
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

  protected override _hit_rect(geometry: RectGeometry): Selection {
    const {sx0, sx1, sy0, sy1} = geometry
    const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
    const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
    const indices = [...this.index.indices({x0, x1, y0, y1})]
    return new Selection({indices})
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_area_vector_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace HexTile {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    r: p.NumberSpec
    q: p.NumberSpec
    scale: p.NumberSpec
    size: p.Property<number>
    aspect_scale: p.Property<number>
    orientation: p.Property<HexTileOrientation>
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
}

export interface HexTile extends HexTile.Attrs { }

export class HexTile extends Glyph {
  declare properties: HexTile.Props
  declare __view_type__: HexTileView

  constructor(attrs?: Partial<HexTile.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HexTileView

    this.mixins<HexTile.Mixins>([LineVector, FillVector, HatchVector])
    this.define<HexTile.Props>(({Number}) => ({
      r:            [ p.NumberSpec, {field: "r"} ],
      q:            [ p.NumberSpec, {field: "q"} ],
      scale:        [ p.NumberSpec, 1.0 ],
      size:         [ Number, 1.0 ],
      aspect_scale: [ Number, 1.0 ],
      orientation:  [ HexTileOrientation, "pointytop" ],
    }))
    this.override<HexTile.Props>({line_color: null})
  }
}
