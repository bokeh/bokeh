import {Model} from "../../model"
import {CategoricalScale} from "../scales/categorical_scale"
import {Scale} from "../scales/scale"
import {LinearScale} from "../scales/linear_scale"
import {LogScale} from "../scales/log_scale"
import {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import {DataRange1d} from "../ranges/data_range1d"
import {FactorRange} from "../ranges/factor_range"
import {type RendererView, type RenderingTarget, Renderer, screen, view} from "../renderers/renderer"
import {DataRenderer, DataRendererView} from "../renderers/data_renderer"
import {RangeManager} from "../plots/range_manager"

import {BBox} from "core/util/bbox"
import {entries} from "core/util/object"
import {View} from "core/view"
import {build_views, remove_views} from "core/build_views"
import * as p from "core/properties"

type Ranges = {[key: string]: Range}
type Scales = {[key: string]: Scale}

export class CartesianFrameView extends View implements RenderingTarget {
  override model: CartesianFrame
  override parent: View & RenderingTarget

  private _bbox: BBox = new BBox()
  get bbox(): BBox {
    return this._bbox
  }

  readonly screen = screen(this.bbox)
  readonly view = view(this.bbox)

  get canvas() {
    return this.parent.canvas
  }

  get frame() {
    return this
  }

  request_repaint(): void {
    this.parent.request_repaint()
  }

  request_paint(to_invalidate: RendererView | RendererView[]): void {
    this.parent.request_paint(to_invalidate)
  }

  readonly range_manager: RangeManager = new RangeManager(this)

  protected _x_target: Range1d = new Range1d()
  protected _y_target: Range1d = new Range1d()

  protected _x_ranges: Map<string, Range>
  protected _y_ranges: Map<string, Range>

  protected _x_scales: Map<string, Scale>
  protected _y_scales: Map<string, Scale>

  protected _setup(): void {
    const {
      x_range, y_range, extra_x_ranges, extra_y_ranges,
      x_scale, y_scale, extra_x_scales, extra_y_scales,
    } = this.model

    this._x_ranges = this._get_ranges(x_range, extra_x_ranges)
    this._y_ranges = this._get_ranges(y_range, extra_y_ranges)

    this._x_scales = this._get_scales(x_scale, extra_x_scales, this._x_ranges, this._x_target)
    this._y_scales = this._get_scales(y_scale, extra_y_scales, this._y_ranges, this._y_target)

    for (const range of this.ranges.values()) {
      if (range instanceof DataRange1d) {
        range.frames.add(this)
      }
    }
  }

  override initialize(): void {
    super.initialize()
    this._setup()
  }

  /*protected*/ _renderer_views: Map<Renderer, RendererView>

  get renderer_views(): RendererView[] {
    return this.model.renderers.map((r) => this._renderer_views.get(r)!)
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    this._renderer_views = new Map()
    await build_views(this._renderer_views, this.model.renderers, {parent: this})
  }

  override remove(): void {
    super.remove()

    for (const range of this.ranges.values()) {
      if (range instanceof DataRange1d) {
        range.frames.delete(this)
      }
    }

    remove_views(this._renderer_views)
  }

  override connect_signals(): void {
    super.connect_signals()

    const {
      x_range, y_range, extra_x_ranges, extra_y_ranges,
      x_scale, y_scale, extra_x_scales, extra_y_scales,
    } = this.model.properties

    this.on_change([
      x_range, y_range, extra_x_ranges, extra_y_ranges,
      x_scale, y_scale, extra_x_scales, extra_y_scales,
    ], () => this._setup())

    const {renderers} = this.model.properties
    this.on_change(renderers, async () => {
      await build_views(this._renderer_views, this.model.renderers, {parent: this})
    })
  }

  protected _get_ranges(range: Range, extra_ranges: Ranges): Map<string, Range> {
    return new Map(entries({...extra_ranges, default: range}))
  }

  protected _get_scales(scale: Scale, extra_scales: Scales, source_ranges: Map<string, Range>, target_range: Range): Map<string, Scale> {
    const in_scales = new Map(entries({...extra_scales, default: scale}))
    const scales: Map<string, Scale> = new Map()

    for (const [name, source_range] of source_ranges) {
      const factor_range = source_range instanceof FactorRange
      const categorical_scale = scale instanceof CategoricalScale

      if (factor_range != categorical_scale) {
        throw new Error(`Range ${source_range.type} is incompatible is Scale ${scale.type}`)
      }

      if (scale instanceof LogScale && source_range instanceof DataRange1d)
        source_range.scale_hint = "log"

      const derived_scale = (in_scales.get(name) ?? scale).clone()
      derived_scale.setv({source_range, target_range})
      scales.set(name, derived_scale)
    }

    return scales
  }

  protected _update_frame_ranges(): void {
    // data to/from screen space transform (left-bottom <-> left-top origin)
    const {bbox} = this
    this._x_target.setv({start: bbox.left, end: bbox.right})
    this._y_target.setv({start: bbox.bottom, end: bbox.top})
  }

  set_geometry(bbox: BBox): void {
    this._bbox = bbox
    this._update_frame_ranges()
    this.screen.update(bbox)
    this.view.update(bbox)
  }

  get x_target(): Range1d {
    return this._x_target
  }

  get y_target(): Range1d {
    return this._y_target
  }

  get x_range(): Range {
    return this.model.x_range
  }

  get y_range(): Range {
    return this.model.y_range
  }

  get x_ranges(): Map<string, Range> {
    return this._x_ranges
  }

  get y_ranges(): Map<string, Range> {
    return this._y_ranges
  }

  get ranges(): Set<Range> {
    return new Set([...this.x_ranges.values(), ...this.y_ranges.values()])
  }

  get x_scales(): Map<string, Scale> {
    return this._x_scales
  }

  get y_scales(): Map<string, Scale> {
    return this._y_scales
  }

  get scales(): Set<Scale> {
    return new Set([...this.x_scales.values(), ...this.y_scales.values()])
  }

  get x_scale(): Scale {
    return this._x_scales.get("default")!
  }

  get y_scale(): Scale {
    return this._y_scales.get("default")!
  }

  get data_renderers(): DataRendererView[] {
    return this.model.renderers
      .filter((r) => r instanceof DataRenderer)
      .map((r) => this._renderer_views.get(r)!) as DataRendererView[]
  }

  get visible(): boolean {
    return true // TODO
  }
}

export namespace CartesianFrame {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    x_range: p.Property<Range>
    y_range: p.Property<Range>

    x_scale: p.Property<Scale>
    y_scale: p.Property<Scale>

    extra_x_ranges: p.Property<{[key: string]: Range}>
    extra_y_ranges: p.Property<{[key: string]: Range}>

    extra_x_scales: p.Property<{[key: string]: Scale}>
    extra_y_scales: p.Property<{[key: string]: Scale}>

    match_aspect: p.Property<boolean>
    aspect_scale: p.Property<number>

    renderers: p.Property<Renderer[]>
  }
}

export interface CartesianFrame extends CartesianFrame.Attrs {}

export class CartesianFrame extends Model {
  override properties: CartesianFrame.Props
  override __view_type__: CartesianFrameView

  constructor(attrs?: Partial<CartesianFrame.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CartesianFrameView

    this.define<CartesianFrame.Props>(({Boolean, Number, Array, Dict, Ref}) => ({
      x_range:        [ Ref(Range), () => new DataRange1d() ],
      y_range:        [ Ref(Range), () => new DataRange1d() ],

      x_scale:        [ Ref(Scale), () => new LinearScale() ],
      y_scale:        [ Ref(Scale), () => new LinearScale() ],

      extra_x_ranges: [ Dict(Ref(Range)), {} ],
      extra_y_ranges: [ Dict(Ref(Range)), {} ],

      extra_x_scales: [ Dict(Ref(Scale)), {} ],
      extra_y_scales: [ Dict(Ref(Scale)), {} ],

      match_aspect:   [ Boolean, false ],
      aspect_scale:   [ Number, 1 ],

      renderers:      [ Array(Ref(Renderer)), [] ],
    }))
  }
}
