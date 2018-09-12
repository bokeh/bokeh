import * as hittest from "core/hittest"
import * as p from "core/properties"
import * as bbox from "core/util/bbox"
import {IBBox} from "core/util/bbox"
import * as proj from "core/util/projections"
import * as visuals from "core/visuals"
import {Geometry, RectGeometry} from "core/geometry"
import {Context2d} from "core/util/canvas"
import {View} from "core/view"
import {Model} from "../../model"
import {Anchor} from "core/enums"
import {logger} from "core/logging"
import {Arrayable} from "core/types"
import {map} from "core/util/arrayable"
import {extend} from "core/util/object"
import {isArray, isTypedArray} from "core/util/types"
import {SpatialIndex, Rect} from "core/util/spatial"
import {LineView} from "./line"
import {Scale} from "../scales/scale"
import {FactorRange} from "../ranges/factor_range"
import {Selection} from "../selections/selection"
import {GlyphRendererView} from "../renderers/glyph_renderer"
import {ColumnarDataSource} from "../sources/columnar_data_source"

export interface GlyphData {}

export interface GlyphView extends GlyphData {}

export abstract class GlyphView extends View {
  model: Glyph
  visuals: Glyph.Visuals

  glglyph?: any

  index: SpatialIndex
  renderer: GlyphRendererView

  protected _nohit_warned: {[key: string]: boolean} = {}

  initialize(options: any): void {
    super.initialize(options)

    this._nohit_warned = {}
    this.renderer = options.renderer
    this.visuals = new visuals.Visuals(this.model)

    // Init gl (this should really be done anytime renderer is set,
    // and not done if it isn't ever set, but for now it only
    // matters in the unit tests because we build a view without a
    // renderer there)
    const {gl} = this.renderer.plot_view

    if (gl != null) {
      let webgl_module = null
      try {
        webgl_module = require("./webgl/index")
      } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
          logger.warn('WebGL was requested and is supported, but bokeh-gl(.min).js is not available, falling back to 2D rendering.')
        } else
          throw e
      }

      if (webgl_module != null) {
        const Cls = webgl_module[this.model.type + 'GLGlyph']
        if (Cls != null)
          this.glglyph = new Cls(gl.ctx, this)
      }
    }
  }

  set_visuals(source: ColumnarDataSource): void {
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
      if (x.minX < bb.minX)
        bb.minX = x.minX
      if (x.maxX > bb.maxX)
        bb.maxX = x.maxX
    }

    const positive_y_bbs = this.index.search(bbox.positive_y())
    for (const y of positive_y_bbs) {
      if (y.minY < bb.minY)
        bb.minY = y.minY
      if (y.maxY > bb.maxY)
        bb.maxY = y.maxY
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

  draw_legend_for_index(_ctx: Context2d, _bbox: IBBox, _index: number): void {}

  hit_test(geometry: Geometry): hittest.HitTestResult {
    let result = null

    const func = `_hit_${geometry.type}`
    if ((this as any)[func] != null) {
      result = (this as any)[func](geometry)
    } else if (this._nohit_warned[geometry.type] == null) {
      logger.debug(`'${geometry.type}' selection not available for ${this.model.type}`)
      this._nohit_warned[geometry.type] = true
    }

    return result
  }

  protected _hit_rect_against_index(geometry: RectGeometry): Selection {
    const {sx0, sx1, sy0, sy1} = geometry
    const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
    const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
    const bb = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    const result = hittest.create_empty_hit_test_result()
    result.indices = this.index.indices(bb)
    return result
  }

  set_data(source: ColumnarDataSource, indices: number[], indices_to_update: number[] | null): void {
    let data = this.model.materialize_dataspecs(source)

    this.visuals.set_all_indices(indices)
    if (indices && !(this instanceof LineView)) {
      const data_subset: {[key: string]: any} = {}
      for (const k in data) {
        const v = data[k]
        if (k.charAt(0) === '_')
          data_subset[k] = indices.map((i) => v[i])
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
        }

        // hand standard glyph case
        else {
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
  export interface Attrs extends Model.Attrs {
    x_range_name: string
    y_range_name: string
  }

  export interface Props extends Model.Props {}

  export interface Visuals extends visuals.Visuals {}
}

export interface Glyph extends Glyph.Attrs {}

export abstract class Glyph extends Model {

  properties: Glyph.Props

  /* prototype */ _coords: [string, string][]

  constructor(attrs?: Partial<Glyph.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Glyph'

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
      result[x] = [ p.NumberSpec ]
      result[y] = [ p.NumberSpec ]
    }

    this.define(result)
  }
}
Glyph.initClass()
