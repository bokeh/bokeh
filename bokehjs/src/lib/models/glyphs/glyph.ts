import type {HitTestResult} from "core/hittest"
import * as p from "core/properties"
import * as bbox from "core/util/bbox"
import * as visuals from "core/visuals"
import * as uniforms from "core/uniforms"
import type * as geometry from "core/geometry"
import {settings} from "core/settings"
import type {Context2d} from "core/util/canvas"
import {DOMComponentView} from "core/dom_view"
import {Model} from "../../model"
import type {Anchor} from "core/enums"
import type {ViewStorage, IterViews} from "core/build_views"
import {build_views} from "core/build_views"
import {logger} from "core/logging"
import type {Arrayable, Rect, FloatArray} from "core/types"
import {ScreenArray, Indices} from "core/types"
import {isString} from "core/util/types"
import {RaggedArray} from "core/util/ragged_array"
import {inplace_map} from "core/util/arrayable"
import {inplace, project_xy} from "core/util/projections"
import {is_equal, EqNotImplemented} from "core/util/eq"
import {SpatialIndex} from "core/util/spatial"
import {assert} from "core/util/assert"
import {BBox} from "core/util/bbox"
import type {Scale} from "../scales/scale"
import type {Factor} from "../ranges/factor_range"
import {FactorRange} from "../ranges/factor_range"
import {Selection} from "../selections/selection"
import type {GlyphRendererView} from "../renderers/glyph_renderer"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import {Decoration} from "../graphics/decoration"
import type {BaseGLGlyph, BaseGLGlyphConstructor} from "./webgl/base"

const {abs, ceil} = Math

export const inherit = Symbol("inherit")

type ValueLike = number | uniforms.Uniform<unknown> | Arrayable<unknown> | RaggedArray<any>

export interface GlyphView extends Glyph.Data {}

export abstract class GlyphView extends DOMComponentView {
  declare model: Glyph
  visuals: Glyph.Visuals

  declare readonly parent: GlyphRendererView

  get renderer(): GlyphRendererView {
    return this.parent
  }

  /** @internal */
  glglyph?: BaseGLGlyph

  async load_glglyph?(): Promise<typeof BaseGLGlyph>

  has_webgl(): this is {glglyph: BaseGLGlyph} {
    return this.glglyph != null && this._can_use_webgl
  }

  private _can_use_webgl: boolean = false
  protected _compute_can_use_webgl(): boolean {
    return true
  }

  private _index: SpatialIndex | null = null

  private _data_size: number | null = null

  protected _nohit_warned: Set<geometry.Geometry["type"]> = new Set()

  get index(): SpatialIndex {
    const {_index} = this
    if (_index != null) {
      return _index
    } else {
      throw new Error(`${this}.index_data() wasn't called`)
    }
  }

  get data_size(): number {
    const {base} = this
    if (base != null) {
      return base.data_size
    } else {
      const {_data_size} = this
      if (_data_size != null) {
        return _data_size
      } else {
        throw new Error(`${this}.set_data() wasn't called`)
      }
    }
  }

  override initialize(): void {
    super.initialize()
    this.visuals = new visuals.Visuals(this)
  }

  readonly decorations: ViewStorage<Decoration> = new Map()

  override *children(): IterViews {
    yield* super.children()
    yield* this.decorations.values()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await build_views(this.decorations, this.model.decorations, {parent: this.parent})

    const {webgl} = this.canvas
    if (webgl != null && this.load_glglyph != null) {
      const cls = await this.load_glglyph() as BaseGLGlyphConstructor
      this.glglyph = new cls(webgl.regl_wrapper, this)
    }
  }

  request_paint(): void {
    this.parent.request_paint()
  }

  get canvas() {
    return this.renderer.parent.canvas_view
  }

  paint(ctx: Context2d, indices: number[], data?: Partial<Glyph.Data>): void {
    if (this.has_webgl()) {
      this.glglyph.render(ctx, indices, this.base ?? this)
    } else if (this.canvas.webgl != null && settings.force_webgl) {
      throw new Error(`${this} doesn't support webgl rendering`)
    } else {
      this._paint(ctx, indices, data)
    }
  }

  protected abstract _paint(ctx: Context2d, indices: number[], data?: Glyph.Data): void

  override has_finished(): boolean {
    return true
  }

  override notify_finished(): void {
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

  sdist(scale: Scale, pts: Arrayable<number>, spans: p.Uniform<number>,
        pts_location: "center" | "edge" = "edge", dilate: boolean = false): ScreenArray {
    const n = pts.length
    const sdist = new ScreenArray(n)

    const compute = scale.s_compute
    if (pts_location == "center") {
      for (let i = 0; i < n; i++) {
        const pts_i = pts[i]
        const halfspan_i = spans.get(i)/2
        const spt0 = compute(pts_i - halfspan_i)
        const spt1 = compute(pts_i + halfspan_i)
        sdist[i] = abs(spt1 - spt0)
      }
    } else {
      for (let i = 0; i < n; i++) {
        const pts_i = pts[i]
        const spt0 = compute(pts_i)
        const spt1 = compute(pts_i + spans.get(i))
        sdist[i] = abs(spt1 - spt0)
      }
    }

    if (dilate) {
      inplace_map(sdist, (sd) => ceil(sd))
    }

    return sdist
  }

  draw_legend_for_index(_ctx: Context2d, _bbox: Rect, _index: number): void {}

  protected _hit_point?(geometry: geometry.PointGeometry): Selection
  protected _hit_span?(geometry: geometry.SpanGeometry): Selection
  protected _hit_rect?(geometry: geometry.RectGeometry): Selection
  protected _hit_poly?(geometry: geometry.PolyGeometry): Selection

  hit_test(geometry: geometry.Geometry): HitTestResult {
    const hit = (() => {
      switch (geometry.type) {
        case "point": return this._hit_point?.(geometry)
        case "span":  return this._hit_span?.(geometry)
        case "rect":  return this._hit_rect?.(geometry)
        case "poly":  return this._hit_poly?.(geometry)
      }
    })()

    if (hit != null) {
      return hit
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

  protected _project_xy<Data>(x: keyof Data, xs: Arrayable<number>, y: keyof Data, ys: Arrayable<number>): void {
    const inherited_x = this._is_inherited(x as string)
    const inherited_y = this._is_inherited(y as string)

    if (!inherited_x && !inherited_y) {
      inplace.project_xy(xs, ys)
    } else if (!inherited_x || !inherited_y) {
      const [proj_x, proj_y] = project_xy(xs, ys)
      this._define_attr(x, proj_x)
      this._define_attr(y, proj_y)
    }
  }

  protected _project_data(): void {}

  private *_iter_visuals(): Generator<p.VectorSpec<unknown> | p.ScalarSpec<unknown>> {
    for (const visual of this.visuals) {
      for (const prop of visual) {
        if (prop instanceof p.VectorSpec || prop instanceof p.ScalarSpec) {
          yield prop
        }
      }
    }
  }

  protected _base: this | null = null

  get base(): this | null {
    return this._base
  }

  set_base<T extends this>(base: T): void {
    if (base != this && base instanceof this.constructor) {
      this._base = base
    } else {
      this._base = null
    }
  }

  protected _define_or_inherit_attr<Data>(attr: keyof Data, fn: () => typeof inherit | ValueLike): void {
    const value = fn()
    if (value === inherit) {
      this._inherit_attr<Data>(attr)
    } else {
      this._define_attr<Data>(attr, value)
    }
  }

  protected _define_attr<Data>(attr: keyof Data, value: ValueLike): void {
    Object.defineProperty(this, attr, {
      configurable: true,
      enumerable: true,
      value,
    })
    this._define_inherited(attr, false)
  }

  protected _inherit_attr<Data>(attr: keyof Data): void {
    const {base} = this
    assert(base != null)
    this._inherit_from(attr, base)
  }

  protected _inherit_from<Data>(attr: keyof Data, base: this): void {
    Object.defineProperty(this, attr, {
      configurable: true,
      enumerable: true,
      get() {
        return base[attr as keyof typeof base]
      },
    })
    this._define_inherited(attr, true)
  }

  protected _define_inherited<Data>(attr: keyof Data, value: boolean): void {
    Object.defineProperty(this, `inherited_${attr as string}`, {
      configurable: true,
      enumerable: true,
      value,
    })
  }

  protected _can_inherit_from<T>(prop: p.Property<T>, base: this | null): boolean {
    if (base == null) {
      return false
    }

    const base_prop = base.model.property(prop.attr)

    const value = prop.get_value()
    const base_value = base_prop.get_value()

    try {
      return is_equal(value, base_value)
    } catch (error) {
      if (error instanceof EqNotImplemented) {
        return false
      } else {
        throw error
      }
    }
  }

  protected _is_inherited<T>(prop: p.Property<T> | string): boolean {
    const name = isString(prop) ? prop : prop.attr
    return this[`inherited_${name}` as keyof this] as boolean
  }

  set_visuals(source: ColumnarDataSource, indices: Indices): void {
    for (const prop of this._iter_visuals()) {
      const {base} = this
      if (base != null && this._can_inherit_from(prop, base)) {
        this._inherit_from(prop.attr, base)
      } else {
        const uniform = prop.uniform(source).select(indices)
        this._define_attr(prop.attr, uniform)
      }
    }

    for (const visual of this.visuals) {
      visual.update()
    }

    if (this.has_webgl()) {
      this.glglyph.set_visuals_changed()
    }
  }

  protected _transform_array<T>(prop: p.BaseCoordinateSpec<T>, array: Arrayable<unknown>) {
    const {x_source, y_source} = this.renderer.coordinates
    const range = prop.dimension == "x" ? x_source : y_source

    if (range instanceof FactorRange) {
      if (prop instanceof p.CoordinateSpec) {
        array = range.v_synthetic(array as Arrayable<number | Factor>)
      } else if (prop instanceof p.CoordinateSeqSpec) {
        for (let i = 0; i < array.length; i++) {
          array[i] = range.v_synthetic(array[i] as Arrayable<number | Factor>)
        }
      } else if (prop instanceof p.CoordinateSeqSeqSeqSpec) {
        // TODO
      }
    }

    let final_array: Arrayable<unknown> | RaggedArray<FloatArray>
    if (prop instanceof p.CoordinateSeqSpec) {
      // TODO: infer precision
      final_array = RaggedArray.from(array as Arrayable<Arrayable<number>>, Float64Array)
    } else if (prop instanceof p.CoordinateSeqSeqSeqSpec) {
      // TODO RaggedArrayN
      final_array = array
    } else {
      final_array = array
    }

    return final_array
  }

  async set_data(source: ColumnarDataSource, indices: Indices, indices_to_update?: number[]): Promise<void> {
    const visuals = new Set(this._iter_visuals())
    const {base} = this

    this._data_size = indices.count

    for (const prop of this.model) {
      if (!(prop instanceof p.VectorSpec || prop instanceof p.ScalarSpec)) {
        continue
      }

      if (visuals.has(prop)) { // let set_visuals() do the work, at least for now
        continue
      }

      if (base != null && this._can_inherit_from(prop, base)) {
        this._inherit_from(prop.attr, base)

        if (prop instanceof p.DistanceSpec || prop instanceof p.ScreenSizeSpec) {
          this._inherit_from(`max_${prop.attr}`, base)
        }
      } else {
        if (prop instanceof p.BaseCoordinateSpec) {
          const array = this._transform_array(prop, indices.select(prop.array(source)))
          this._define_attr(prop.attr, array)
        } else {
          const uniform = prop.uniform(source).select(indices)
          this._define_attr(prop.attr, uniform)

          if (prop instanceof p.DistanceSpec || prop instanceof p.ScreenSizeSpec) {
            const max_value = uniforms.max(uniform)
            this._define_attr(`max_${prop.attr}`, max_value)
          }
        }
      }
    }

    if (this.renderer.plot_view.model.use_map) {
      this._project_data()
    }

    this._set_data(indices_to_update ?? null) // TODO doesn't take subset indices into account
    await this._set_lazy_data(indices_to_update ?? null) // TODO doesn't take subset indices into account

    for (const decoration of this.decorations.values()) {
      decoration.marking.set_data(source, indices)
    }

    if (this.glglyph != null) {
      this._can_use_webgl = this._compute_can_use_webgl()
    }

    if (this.has_webgl()) {
      this.glglyph.set_data_changed()
    }

    if (base == null) {
      this.index_data()
    }
  }

  protected _set_data(_indices: number[] | null): void {}
  protected async _set_lazy_data(_indices: number[] | null): Promise<void> {}

  /**
   * Any data transformations that require visuals.
   */
  after_visuals(): void {}

  async after_lazy_visuals(): Promise<void> {}

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

  mask_data(): Indices {
    /** Returns subset indices in the viewport. */
    if (this._mask_data == null) {
      return Indices.all_set(this.data_size)
    } else {
      return this._mask_data()
    }
  }

  protected _mask_data?(): Indices

  map_data(): void {
    const {x_scale, y_scale} = this.renderer.coordinates
    const {base} = this

    const v_compute = <T>(prop: p.BaseCoordinateSpec<T>) => {
      const scale = prop.dimension == "x" ? x_scale : y_scale
      const array = this[prop.attr as keyof this] as Arrayable<number> | RaggedArray
      if (array instanceof RaggedArray) {
        return new RaggedArray(array.offsets, scale.v_compute(array.data))
      } else {
        return scale.v_compute(array)
      }
    }

    for (const prop of this.model) {
      if (prop instanceof p.BaseCoordinateSpec) {
        if (base != null && this._is_inherited(prop)) {
          this._inherit_from(`s${prop.attr}`, base)
        } else {
          const array = v_compute(prop)
          this._define_attr(`s${prop.attr}`, array)
        }
      }
    }

    this._map_data()
    if (this.has_webgl()) {
      this.glglyph.set_data_mapped()
    }
  }

  // This is where specs not included in coords are computed, e.g. radius.
  protected _map_data(): void {}

  override get bbox(): BBox | undefined {
    if (this.base == null) {
      const {x0, y0, x1, y1} = this.index.bbox
      const {x_scale, y_scale} = this.renderer.coordinates
      const [sx0, sx1] = x_scale.r_compute(x0, x1)
      const [sy0, sy1] = y_scale.r_compute(y0, y1)
      return BBox.from_rect({x0: sx0, y0: sy0, x1: sx1, y1: sy1})
    } else {
      return undefined
    }
  }
}

export namespace Glyph {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    decorations: p.Property<Decoration[]>
  }

  export type Visuals = visuals.Visuals

  export type Data = p.GlyphDataOf<Props>
}

export interface Glyph extends Glyph.Attrs {}

export abstract class Glyph extends Model {
  declare properties: Glyph.Props
  declare __view_type__: GlyphView

  constructor(attrs?: Partial<Glyph.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Glyph.Props>(({List, Ref}) => ({
      decorations: [ List(Ref(Decoration)), [] ],
    }))
  }
}
