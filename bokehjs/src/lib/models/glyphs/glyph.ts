import {HitTestResult} from "core/hittest"
import * as p from "core/properties"
import * as bbox from "core/util/bbox"
import * as visuals from "core/visuals"
import {VisualProperties} from "core/visuals/visual"
import * as geometry from "core/geometry"
import {Context2d} from "core/util/canvas"
import {View} from "core/view"
import {Model} from "../../model"
import {Anchor} from "core/enums"
import {logger} from "core/logging"
import {Arrayable, Rect, FloatArray, ScreenArray, Indices} from "core/types"
import {RaggedArray} from "core/util/ragged_array"
import {map, max} from "core/util/arrayable"
import {values} from "core/util/object"
import {is_equal} from "core/util/eq"
import {SpatialIndex} from "core/util/spatial"
import {Scale} from "../scales/scale"
import {FactorRange, Factor} from "../ranges/factor_range"
import {Selection} from "../selections/selection"
import {GlyphRendererView} from "../renderers/glyph_renderer"
import {ColumnarDataSource} from "../sources/columnar_data_source"

import type {BaseGLGlyph} from "./webgl/base"

export type GlyphData = {}

export interface GlyphView extends GlyphData {}

export abstract class GlyphView extends View {
  model: Glyph
  visuals: Glyph.Visuals

  readonly parent: GlyphRendererView

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
    this.visuals = new visuals.Visuals(this)
  }

  request_paint(): void {
    this.parent.request_paint()
  }

  render(ctx: Context2d, indices: number[], data: any): void {
    ctx.beginPath()

    if (this.glglyph != null) {
      this.renderer.needs_webgl_blit = this.glglyph.render(ctx, indices, data)
      if (this.renderer.needs_webgl_blit)
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
      case "center":
      case "center_center": {
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
        pts_location: "center" | "edge" = "edge", dilate: boolean = false): ScreenArray {
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
    const [x0, x1] = this.renderer.coordinates.x_scale.r_invert(sx0, sx1)
    const [y0, y1] = this.renderer.coordinates.y_scale.r_invert(sy0, sy1)
    const indices = [...this.index.indices({x0, x1, y0, y1})]
    return new Selection({indices})
  }

  protected _project_data(): void {}

  private *_iter_visuals(): Generator<p.VectorSpec<unknown> | p.ScalarSpec<unknown>> {
    for (const visual of values<VisualProperties>(this.visuals)) {
      for (const prop of visual) {
        if (prop instanceof p.VectorSpec || prop instanceof p.ScalarSpec)
          yield prop
      }
    }
  }

  protected base?: this
  set_base<T extends this>(base: T): void {
    if (base != this && base instanceof this.constructor)
      this.base = base
  }

  set_visuals(source: ColumnarDataSource, indices: Indices): void {
    const self = this as any

    for (const prop of this._iter_visuals()) {
      const {base} = this
      if (base != null) {
        const base_prop = (base.model.properties as {[key: string]: p.Property<unknown> | undefined})[prop.attr]
        if (base_prop != null && is_equal(prop.get_value(), base_prop.get_value())) {
          self[`${prop.attr}`] = (base as any)[`${prop.attr}`]
          continue
        }
      }

      const uniform = prop.uniform(source).select(indices)
      self[`${prop.attr}`] = uniform
    }

    this.glglyph?.set_visuals_changed()
  }

  set_data(source: ColumnarDataSource, indices: Indices, indices_to_update?: number[]): void {
    const {x_range, y_range} = this.renderer.coordinates

    this._data_size = indices.count

    const visual_props = new Set(this._iter_visuals())
    const self = this as any

    for (const prop of this.model) {
      if (!(prop instanceof p.VectorSpec || prop instanceof p.ScalarSpec))
        continue

      if (visual_props.has(prop)) // let set_visuals() do the work, at least for now
        continue

      if (prop.can_skip)
        continue

      const name = prop.attr

      if (prop instanceof p.ScalarSpec) {
        const uniform = prop.uniform(source).select(indices)
        self[`${prop.attr}`] = uniform
      } else {
        const base_array = prop.array(source)
        let array = indices.select(base_array)

        let final_array: Arrayable<unknown> | RaggedArray<FloatArray> = array
        if (prop instanceof p.BaseCoordinateSpec) {
          const range = prop.dimension == "x" ? x_range : y_range
          if (range instanceof FactorRange) {
            if (prop instanceof p.CoordinateSpec) {
              array = range.v_synthetic(array as Arrayable<number | Factor>)
            } else if (prop instanceof p.CoordinateSeqSpec) {
              for (let i = 0; i < array.length; i++) {
                array[i] = range.v_synthetic(array[i] as Arrayable<number | Factor>)
              }
            }
          }

          if (prop instanceof p.CoordinateSeqSpec) {
            // TODO: infer precision
            final_array = RaggedArray.from(array as Arrayable<Arrayable<number>>, Float64Array)
          } else
            final_array = array
        } else if (prop instanceof p.DistanceSpec) {
          self[`max_${name}`] = max(array as Arrayable<number>)
        }

        self[`_${name}`] = final_array
      }
    }

    if (this.renderer.plot_view.model.use_map) {
      this._project_data()
    }

    this._set_data(indices_to_update ?? null)  // TODO doesn't take subset indices into account

    this.glglyph?.set_data_changed()

    this.index_data()
  }

  protected _set_data(_indices: number[] | null): void {}

  private get _index_size(): number {
    return this.data_size
  }

  protected abstract _index_data(index: SpatialIndex): void

  index_data(): void {
    const index = new SpatialIndex(this._index_size)
    this._index_data(index)
    index.finish()
    this._index = index
  }

  mask_data(): Indices {
    /** Returns subset indices in the viewport. */
    if (this._mask_data == null)
      return Indices.all_set(this.data_size)
    else
      return this._mask_data()
  }

  protected _mask_data?(): Indices

  map_data(): void {
    const self = this as any

    const {x_scale, y_scale} = this.renderer.coordinates
    for (const prop of this.model) {
      if (prop instanceof p.BaseCoordinateSpec) {
        const scale = prop.dimension == "x" ? x_scale : y_scale
        let array = self[`_${prop.attr}`] as FloatArray | RaggedArray<FloatArray>
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
    this.glglyph?.set_data_changed()
  }

  // This is where specs not included in coords are computed, e.g. radius.
  protected _map_data(): void {}
}

export namespace Glyph {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props

  export type Visuals = {}
}

export interface Glyph extends Glyph.Attrs {}

export abstract class Glyph extends Model {
  properties: Glyph.Props
  __view_type__: GlyphView

  constructor(attrs?: Partial<Glyph.Attrs>) {
    super(attrs)
  }
}
