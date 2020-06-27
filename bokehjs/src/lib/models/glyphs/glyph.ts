import {HitTestResult} from "core/hittest"
import * as p from "core/properties"
import * as bbox from "core/util/bbox"
import * as visuals from "core/visuals"
import * as geometry from "core/geometry"
import {Context2d} from "core/util/canvas"
import {View} from "core/view"
import {Model} from "../../model"
import {Anchor} from "core/enums"
import {logger} from "core/logging"
import {Arrayable, Rect, NumberArray, RaggedArray} from "core/types"
import {map, max, subselect} from "core/util/arrayable"
import {SpatialIndex} from "core/util/spatial"
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

  protected _project_data(): void {}

  set_data(source: ColumnarDataSource, indices: number[], indices_to_update: number[] | null): void {
    const {x_range, y_range} = this.renderer.scope

    this._data_size = source.get_length() ?? 1

    for (const prop of this.model) {
      if (!(prop instanceof p.VectorSpec))
        continue

      // this skips optional properties like radius for circles
      if (prop.optional && prop.spec.value == null && !prop.dirty)
        continue

      const name = prop.attr
      let array = subselect(prop.array(source), indices)

      if (prop instanceof p.BaseCoordinateSpec) {
        const range = prop.dimension == "x" ? x_range : y_range
        if (range instanceof FactorRange) {
          if (prop instanceof p.CoordinateSpec) {
            array = range.v_synthetic(array as any)
          } else if (prop instanceof p.CoordinateSeqSpec) {
            for (let i = 0; i < array.length; i++) {
              array[i] = range.v_synthetic(array[i] as any)
            }
          }
        }

        if (prop instanceof p.CoordinateSeqSpec) {
          array = RaggedArray.from(array as any) as any
        }
      } else if (prop instanceof p.DistanceSpec) {
        (this as any)[`max_${name}`] = max(array as any)
      }

      (this as any)[`_${name}`] = array
    }

    if (this.renderer.plot_view.model.use_map) {
      this._project_data()
    }

    this.glglyph?.set_data_changed()

    this._set_data(indices_to_update)  // TODO doesn't take subset indices into account

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
    const self = this as any

    const {x_scale, y_scale} = this.renderer.scope
    for (const prop of this.model) {
      if (prop instanceof p.BaseCoordinateSpec) {
        const scale = prop.dimension == "x" ? x_scale : y_scale
        let array = self[`_${prop.attr}`] as NumberArray | RaggedArray
        if (array instanceof RaggedArray) {
          const screen = scale.v_compute(array.array)
          array = new RaggedArray(array.offsets, screen)
        } else {
          array = scale.v_compute(array)
        }
        (this as any)[`s${prop.attr}`] = array
      }
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
