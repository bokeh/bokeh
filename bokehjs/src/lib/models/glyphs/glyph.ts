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
import {Arrayable, Rect, NumberArray} from "core/types"
import {map, subselect} from "core/util/arrayable"
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

  private _index: SpatialIndex | null = null

  private _data_size: number | null = null

  protected _nohit_warned: Set<geometry.Geometry["type"]> = new Set()

  get index(): SpatialIndex {
    const {_index} = this
    if (_index != null)
      return _index
    else
      throw new Error(`${this}.index_data() wasn't called`)
  }

  get data_size(): number {
    const {_data_size} = this
    if (_data_size != null)
      return _data_size
    else
      throw new Error(`${this}.set_data() wasn't called`)
  }

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
    const {x0, x1} = this.index.bounds(bbox.positive_x())
    const {y0, y1} = this.index.bounds(bbox.positive_y())
    return this._bounds({x0, y0, x1, y1})
  }

  get_anchor_point(anchor: Anchor, i: number, [sx, sy]: [number, number]): {x: number, y: number} | null {
    switch (anchor) {
      case "center": {
        const [x, y] = this.scenterxy(i, sx, sy)
        return {x, y}
      }
      default:
        return null
    }
  }

  // glyphs that need more sophisticated "snap to data" behaviour (like
  // snapping to a patch centroid, e.g, should override these
  abstract scenterxy(i: number, sx: number, sy: number): [number, number]

  /** @deprecated */
  scenterx(i: number, sx: number, sy: number): number {
    return this.scenterxy(i, sx, sy)[0]
  }
  /** @deprecated */
  scentery(i: number, sx: number, sy: number): number {
    return this.scenterxy(i, sx, sy)[1]
  }

  sdist(scale: Scale, pts: Arrayable<number>, spans: Arrayable<number>,
        pts_location: "center" | "edge" = "edge", dilate: boolean = false): NumberArray {
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
    const [x0, x1] = this.renderer.scope.x_scale.r_invert(sx0, sx1)
    const [y0, y1] = this.renderer.scope.y_scale.r_invert(sy0, sy1)
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
          data_subset[k] = subselect(v as Arrayable<unknown>, indices)
        else
          data_subset[k] = v
      }
      data = data_subset
    }

    let data_size = Infinity
    for (const k in data) {
      if (k.charAt(0) === '_')
        data_size = Math.min(data_size, (data[k] as any).length)
    }
    if (data_size != Infinity)
      this._data_size = data_size
    else
      this._data_size = 0 // XXX: this only happens in degenerate unit tests

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

    function num_array(array: Arrayable<number>): NumberArray {
      if (array instanceof NumberArray)
        return array
      else
        return new NumberArray(array)
    }

    // if we have any coordinates that are categorical, convert them to
    // synthetic coords here
    const xr = this.renderer.scope.x_range
    const yr = this.renderer.scope.y_range

    // XXX: MultiPolygons is a special case of special cases
    if (this.model.type != "MultiPolygons") {
      for (let [xname, yname] of this.model._coords) {
        xname = `_${xname}`
        yname = `_${yname}`

        // TODO (bev) more robust detection of multi-glyph case
        // hand multi glyph case
        if (self._xs != null) {
          if (xr instanceof FactorRange)
            self[xname] = map(self[xname], (arr: any) => xr.v_synthetic(arr))
          else
            self[xname] = map(self[xname], num_array)
          if (yr instanceof FactorRange)
            self[yname] = map(self[yname], (arr: any) => yr.v_synthetic(arr))
          else
            self[yname] = map(self[yname], num_array)
        } else {
          // hand standard glyph case
          if (xr instanceof FactorRange)
            self[xname] = xr.v_synthetic(self[xname])
          else
            self[xname] = num_array(self[xname])
          if (yr instanceof FactorRange)
            self[yname] = yr.v_synthetic(self[yname])
          else
            self[yname] = num_array(self[yname])
        }
      }
    }

    if (this.glglyph != null)
      this.glglyph.set_data_changed(self._x.length)

    this._set_data(indices_to_update)  //TODO doesn't take subset indices into account

    this.index_data()
  }

  protected _set_data(_indices: number[] | null): void {}

  protected get _index_size(): number {
    return this.data_size
  }

  protected abstract _index_data(index: SpatialIndex): void

  index_data(): void {
    const index = new SpatialIndex(this._index_size)
    this._index_data(index)
    index.finish()
    this._index = index
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
          const [sx, sy] = this.renderer.scope.map_to_screen(self[xname][i], self[yname][i])
          self[sxname][i] = sx
          self[syname][i] = sy
        }
      } else
        [self[sxname], self[syname]] = this.renderer.scope.map_to_screen(self[xname], self[yname])
    }

    this._map_data()
  }

  // This is where specs not included in coords are computed, e.g. radius.
  protected _map_data(): void {}
}

export namespace Glyph {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props

  export type Visuals = visuals.Visuals
}

export interface Glyph extends Glyph.Attrs {}

export abstract class Glyph extends Model {
  properties: Glyph.Props
  __view_type__: GlyphView

  constructor(attrs?: Partial<Glyph.Attrs>) {
    super(attrs)
  }

  static init_Glyph(): void {}
}
