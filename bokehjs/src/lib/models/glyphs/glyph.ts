import {HitTestResult} from "core/hittest"
import * as p from "core/properties"
import * as bbox from "core/util/bbox"
import * as proj from "core/util/projections"
import * as visuals from "core/visuals"
import * as geometry from "core/geometry"
import {Context2d} from "core/util/canvas"
import {View} from "core/view"
import {Model} from "../../model"
import {Anchor} from "core/enums"
import {logger} from "core/logging"
import {Arrayable, Rect} from "core/types"
import {map} from "core/util/arrayable"
import {extend} from "core/util/object"
import {isArray, isTypedArray} from "core/util/types"
import {SpatialIndex} from "core/util/spatial"
import {LineView} from "./line"
import {Scale} from "../scales/scale"
import {FactorRange} from "../ranges/factor_range"
import {Selection} from "../selections/selection"
import {GlyphRendererView} from "../renderers/glyph_renderer"
import {ColumnarDataSource} from "../sources/columnar_data_source"

import type {BaseGLGlyph} from "./webgl/base"

export interface GlyphData {}

export interface GlyphView extends GlyphData {}

export abstract class GlyphView extends View {
  model: Glyph
  visuals: Glyph.Visuals

  parent: GlyphRendererView

  get renderer(): GlyphRendererView {
    return this.parent
  }

  /** @internal */
  glglyph?: BaseGLGlyph

  get has_webgl(): boolean {
    return this.glglyph != null
  }

  index: SpatialIndex

  protected _nohit_warned: Set<geometry.Geometry["type"]> = new Set()

  initialize(): void {
    super.initialize()
    this.visuals = new visuals.Visuals(this.model)
  }

  async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {webgl} = this.renderer.plot_view.canvas_view
    if (webgl != null) {
      let webgl_module: typeof import("./webgl/index") | null = null
      try {
        webgl_module = await import("./webgl/index")
      } catch (e) {
        // TODO: this exposes the underyling module system
        if (e.code === 'MODULE_NOT_FOUND')
          logger.warn('WebGL was requested and is supported, but bokeh-gl(.min).js is not available, falling back to 2D rendering.')
        else
          throw e
      }

      if (webgl_module != null) {
        const Cls = (webgl_module as any)[this.model.type + 'GLGlyph']
        if (Cls != null)
          this.glglyph = new Cls(webgl.gl, this)
      }
    }
  }

  set_visuals(source: ColumnarDataSource, indices: number[]): void {
    this.visuals.set_all_indices(indices)
    this.visuals.warm_cache(source)

    if (this.glglyph != null)
      this.glglyph.set_visuals_changed()
  }

  render(ctx: Context2d, indices: number[], data: any): void {
    ctx.beginPath()

    if (this.glglyph != null) {
      if (this.glglyph.render(ctx, indices, data))
        return
    }

    this._render(ctx, indices, data)
  }

  protected abstract _render(ctx: Context2d, indices: number[], data: any): void

  has_finished(): boolean {
    return true
  }

  notify_finished(): void {
    this.renderer.notify_finished()
  }

  protected _bounds(bounds: Rect): Rect {
    return bounds
  }

  bounds(): Rect {
    return this._bounds(this.index.bbox)
  }

  log_bounds(): Rect {
    const bb = bbox.empty()

    const positive_x_bbs = this.index.search(bbox.positive_x())
    for (const x of positive_x_bbs) {
      if (x.x0 < bb.x0)
        bb.x0 = x.x0
      if (x.x1 > bb.x1)
        bb.x1 = x.x1
    }

    const positive_y_bbs = this.index.search(bbox.positive_y())
    for (const y of positive_y_bbs) {
      if (y.y0 < bb.y0)
        bb.y0 = y.y0
      if (y.y1 > bb.y1)
        bb.y1 = y.y1
    }

    return this._bounds(bb)
  }

  get_anchor_point(anchor: Anchor, i: number, [sx, sy]: [number, number]): {x: number, y: number} | null {
    switch (anchor) {
      case "center": return {x: this.scenterx(i, sx, sy), y: this.scentery(i, sx, sy)}
      default:       return null
    }
  }

  // glyphs that need more sophisticated "snap to data" behaviour (like
  // snapping to a patch centroid, e.g, should override these
  abstract scenterx(i: number, _sx: number, _sy: number): number

  abstract scentery(i: number, _sx: number, _sy: number): number

  sdist(scale: Scale, pts: Arrayable<number>, spans: Arrayable<number>,
        pts_location: "center" | "edge" = "edge", dilate: boolean = false): Arrayable<number> {
    let pt0: Arrayable<number>
    let pt1: Arrayable<number>

    const n = pts.length
    if (pts_location == 'center') {
      const halfspan = map(spans, (d) => d/2)
      pt0 = new Float64Array(n)
      for (let i = 0; i < n; i++) {
        pt0[i] = pts[i] - halfspan[i]
      }
      pt1 = new Float64Array(n)
      for (let i = 0; i < n; i++) {
        pt1[i] = pts[i] + halfspan[i]
      }
    } else {
      pt0 = pts
      pt1 = new Float64Array(n)
      for (let i = 0; i < n; i++) {
        pt1[i] = pt0[i] + spans[i]
      }
    }

    const spt0 = scale.v_compute(pt0)
    const spt1 = scale.v_compute(pt1)

    if (dilate)
      return map(spt0, (_, i) => Math.ceil(Math.abs(spt1[i] - spt0[i])))
    else
      return map(spt0, (_, i) => Math.abs(spt1[i] - spt0[i]))
  }

  draw_legend_for_index(_ctx: Context2d, _bbox: Rect, _index: number): void {}

  protected _hit_point?(geometry: geometry.PointGeometry): Selection
  protected _hit_span?(geometry: geometry.SpanGeometry): Selection
  protected _hit_rect?(geometry: geometry.RectGeometry): Selection
  protected _hit_poly?(geometry: geometry.PolyGeometry): Selection

  hit_test(geometry: geometry.Geometry): HitTestResult {
    switch (geometry.type) {
      case "point":
        if (this._hit_point != null)
          return this._hit_point(geometry)
        break
      case "span":
        if (this._hit_span != null)
          return this._hit_span(geometry)
        break
      case "rect":
        if (this._hit_rect != null)
          return this._hit_rect(geometry)
        break
      case "poly":
        if (this._hit_poly != null)
          return this._hit_poly(geometry)
        break
    }

    if (!this._nohit_warned.has(geometry.type)) {
      logger.debug(`'${geometry.type}' selection not available for ${this.model.type}`)
      this._nohit_warned.add(geometry.type)
    }

    return null
  }

  protected _hit_rect_against_index(geometry: geometry.RectGeometry): Selection {
    const {sx0, sx1, sy0, sy1} = geometry
    const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
    const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
    const indices = this.index.indices({x0, x1, y0, y1})
    return new Selection({indices})
  }

  set_data(source: ColumnarDataSource, indices: number[], indices_to_update: number[] | null): void {
    let data = this.model.materialize_dataspecs(source)

    if (indices && !(this instanceof LineView)) {
      const data_subset: {[key: string]: any} = {}
      for (const k in data) {
        const v = data[k]
        if (k.charAt(0) === '_')
          data_subset[k] = indices.map((i) => (v as Arrayable)[i])
        else
          data_subset[k] = v
      }
      data = data_subset
    }

    const self = this as any
    extend(self, data)

    // TODO (bev) Should really probably delegate computing projected
    // coordinates to glyphs, instead of centralizing here in one place.
    if (this.renderer.plot_view.model.use_map) {
      if (self._x != null)
        [self._x, self._y] = proj.project_xy(self._x, self._y)

      if (self._xs != null)
        [self._xs, self._ys] = proj.project_xsys(self._xs, self._ys)

      if (self._x0 != null)
        [self._x0, self._y0] = proj.project_xy(self._x0, self._y0)

      if (self._x1 != null)
        [self._x1, self._y1] = proj.project_xy(self._x1, self._y1)
    }

    // if we have any coordinates that are categorical, convert them to
    // synthetic coords here
    if (this.renderer.plot_view.frame.x_ranges != null) {   // XXXX JUST TEMP FOR TESTS TO PASS
      const xr = this.renderer.plot_view.frame.x_ranges[this.model.x_range_name]
      const yr = this.renderer.plot_view.frame.y_ranges[this.model.y_range_name]

      for (let [xname, yname] of this.model._coords) {
        xname = `_${xname}`
        yname = `_${yname}`

        // TODO (bev) more robust detection of multi-glyph case
        // hand multi glyph case
        if (self._xs != null) {
          if (xr instanceof FactorRange) {
            self[xname] = map(self[xname], (arr: any) => xr.v_synthetic(arr))
          }
          if (yr instanceof FactorRange) {
            self[yname] = map(self[yname], (arr: any) => yr.v_synthetic(arr))
          }
        } else {
          // hand standard glyph case
          if (xr instanceof FactorRange) {
            self[xname] = xr.v_synthetic(self[xname])
          }
          if (yr instanceof FactorRange) {
            self[yname] = yr.v_synthetic(self[yname])
          }
        }
      }
    }

    if (this.glglyph != null)
      this.glglyph.set_data_changed(self._x.length)

    this._set_data(indices_to_update)  //TODO doesn't take subset indices into account

    this.index_data()
  }

  protected _set_data(_indices: number[] | null): void {}

  protected abstract _index_data(): SpatialIndex

  index_data(): void {
    this.index = this._index_data()
  }

  mask_data(indices: number[]): number[] {
    // WebGL can do the clipping much more efficiently
    if (this.glglyph != null || this._mask_data == null)
      return indices
    else
      return this._mask_data()
  }

  protected _mask_data?(): number[]

  map_data(): void {
    // TODO: if using gl, skip this (when is this called?)
    // map all the coordinate fields
    const self = this as any

    for (let [xname, yname] of this.model._coords) {
      const sxname = `s${xname}`
      const syname = `s${yname}`
      xname = `_${xname}`
      yname = `_${yname}`

      if (self[xname] != null && (isArray(self[xname][0]) || isTypedArray(self[xname][0]))) {
        const n = self[xname].length

        self[sxname] = new Array(n)
        self[syname] = new Array(n)

        for (let i = 0; i < n; i++) {
          const [sx, sy] = this.map_to_screen(self[xname][i], self[yname][i])
          self[sxname][i] = sx
          self[syname][i] = sy
        }
      } else
        [self[sxname], self[syname]] = this.map_to_screen(self[xname], self[yname])
    }

    this._map_data()
  }

  // This is where specs not included in coords are computed, e.g. radius.
  protected _map_data(): void {}

  map_to_screen(x: Arrayable<number>, y: Arrayable<number>): [Arrayable<number>, Arrayable<number>] {
    return this.renderer.plot_view.map_to_screen(x, y, this.model.x_range_name, this.model.y_range_name)
  }
}

export namespace Glyph {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    x_range_name: p.Property<string>
    y_range_name: p.Property<string>
  }

  export type Visuals = visuals.Visuals
}

export interface Glyph extends Glyph.Attrs {}

export abstract class Glyph extends Model {
  properties: Glyph.Props
  __view_type__: GlyphView

  /* prototype */ _coords: [string, string][]

  constructor(attrs?: Partial<Glyph.Attrs>) {
    super(attrs)
  }

  static init_Glyph(): void {
    this.prototype._coords = []

    this.internal({
      x_range_name: [ p.String, 'default' ],
      y_range_name: [ p.String, 'default' ],
    })
  }

  static coords(coords: [string, string][]): void {
    const _coords = this.prototype._coords.concat(coords)
    this.prototype._coords = _coords

    const result: any = {}
    for (const [x, y] of coords) {
      result[x] = [ p.CoordinateSpec ]
      result[y] = [ p.CoordinateSpec ]
    }

    this.define<Glyph.Props>(result)
  }
}
