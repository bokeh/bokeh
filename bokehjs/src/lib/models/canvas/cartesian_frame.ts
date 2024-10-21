import {CanvasPanel, CanvasPanelView} from "./canvas_panel"
import {CategoricalScale} from "../scales/categorical_scale"
import {LogScale} from "../scales/log_scale"
import {Scale} from "../scales/scale"
import {LinearScale} from "../scales/linear_scale"
import {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import {DataRange1d} from "../ranges/data_range1d"
import {FactorRange} from "../ranges/factor_range"
import type {BBox} from "core/util/bbox"
import {entries} from "core/util/object"
import {assert} from "core/util/assert"
import type {Dict} from "core/types"
import type * as p from "core/properties"

type Ranges = Dict<Range>
type Scales = Dict<Scale>

export class CartesianFrameView extends CanvasPanelView {
  declare model: CartesianFrame

  override initialize(): void {
    super.initialize()
    this._configure_scales()
  }

  override remove(): void {
    this._unregister_frame()
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()
    const {x_range, y_range, x_scale, y_scale, extra_x_ranges, extra_y_ranges, extra_x_scales, extra_y_scales} = this.model.properties
    this.on_change([x_range, y_range, x_scale, y_scale, extra_x_ranges, extra_y_ranges, extra_x_scales, extra_y_scales], () => {
      this._configure_scales()
    })
  }

  protected _x_target: Range1d
  protected _y_target: Range1d

  protected _x_ranges: Map<string, Range> = new Map()
  protected _y_ranges: Map<string, Range> = new Map()

  protected _x_scales: Map<string, Scale> = new Map()
  protected _y_scales: Map<string, Scale> = new Map()

  protected _x_scale: Scale
  protected _y_scale: Scale

  protected _get_ranges(range: Range, extra_ranges: Ranges): Map<string, Range> {
    return new Map([...entries(extra_ranges), ["default", range]])
  }

  protected _get_scales(scale: Scale, extra_scales: Scales, ranges: Map<string, Range>, frame_range: Range): Map<string, Scale> {
    const in_scales = new Map([...entries(extra_scales), ["default", scale]])
    const scales: Map<string, Scale> = new Map()

    for (const [name, range] of ranges) {
      const factor_range = range instanceof FactorRange
      const categorical_scale = scale instanceof CategoricalScale

      if (factor_range != categorical_scale) {
        throw new Error(`'${range.type}' is incompatible '${scale.type}'`)
      }

      if (scale instanceof LogScale && range instanceof DataRange1d) {
        range.scale_hint = "log"
      }

      const base_scale = in_scales.get(name) ?? scale
      const derived_scale = base_scale.clone()
      derived_scale.setv({source_range: range, target_range: frame_range})
      scales.set(name, derived_scale)
    }

    return scales
  }

  protected _configure_ranges(): void {
    // data to/from screen space transform (left-bottom <-> left-top origin)
    const {bbox} = this
    this._x_target = new Range1d({start: bbox.left, end: bbox.right})
    this._y_target = new Range1d({start: bbox.bottom, end: bbox.top})
  }

  protected _configure_scales(): void {
    const {x_range, y_range, extra_x_ranges, extra_y_ranges} = this.model
    const {x_scale, y_scale, extra_x_scales, extra_y_scales} = this.model

    assert(x_scale.properties.source_range.is_unset && x_scale.properties.target_range.is_unset)
    assert(y_scale.properties.source_range.is_unset && y_scale.properties.target_range.is_unset)

    this._configure_ranges()

    this._unregister_frame()
    this._x_ranges = this._get_ranges(x_range, extra_x_ranges)
    this._y_ranges = this._get_ranges(y_range, extra_y_ranges)
    this._register_frame()

    this._x_scales = this._get_scales(x_scale, extra_x_scales, this._x_ranges, this._x_target)
    this._y_scales = this._get_scales(y_scale, extra_y_scales, this._y_ranges, this._y_target)

    this._x_scale = this._x_scales.get("default")!
    this._y_scale = this._y_scales.get("default")!

    this.mark_finished()
  }

  protected _update_scales(): void {
    this._configure_ranges()

    for (const [, scale] of this._x_scales) {
      scale.target_range = this._x_target
    }

    for (const [, scale] of this._y_scales) {
      scale.target_range = this._y_target
    }
  }

  protected _register_frame(): void {
    for (const range of this.ranges.values()) {
      range.frames.add(this)
    }
  }

  protected _unregister_frame(): void {
    for (const range of this.ranges.values()) {
      range.frames.delete(this)
    }
  }

  override set_geometry(bbox: BBox): void {
    super.set_geometry(bbox)
    this._update_scales()
  }

  get x_range(): Range {
    return this.model.x_range
  }

  get y_range(): Range {
    return this.model.y_range
  }

  get x_target(): Range1d {
    return this._x_target
  }

  get y_target(): Range1d {
    return this._y_target
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
    return this._x_scale
  }

  get y_scale(): Scale {
    return this._y_scale
  }
}

export namespace CartesianFrame {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CanvasPanel.Props & {
    x_range: p.Property<Range>
    y_range: p.Property<Range>

    x_scale: p.Property<Scale>
    y_scale: p.Property<Scale>

    extra_x_ranges: p.Property<Dict<Range>>
    extra_y_ranges: p.Property<Dict<Range>>

    extra_x_scales: p.Property<Dict<Scale>>
    extra_y_scales: p.Property<Dict<Scale>>

    match_aspect: p.Property<boolean>
    aspect_scale: p.Property<number>
  }
}

export interface CartesianFrame extends CartesianFrame.Attrs {}

export class CartesianFrame extends CanvasPanel {
  declare properties: CartesianFrame.Props
  declare __view_type__: CartesianFrameView

  constructor(attrs?: Partial<CartesianFrame.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CartesianFrameView

    this.define<CartesianFrame.Props>(({Bool, Float, Dict, Ref}) => ({
      x_range:        [ Ref(Range), () => new DataRange1d() ],
      y_range:        [ Ref(Range), () => new DataRange1d() ],

      x_scale:        [ Ref(Scale), () => new LinearScale() ],
      y_scale:        [ Ref(Scale), () => new LinearScale() ],

      extra_x_ranges: [ Dict(Ref(Range)), {} ],
      extra_y_ranges: [ Dict(Ref(Range)), {} ],

      extra_x_scales: [ Dict(Ref(Scale)), {} ],
      extra_y_scales: [ Dict(Ref(Scale)), {} ],

      match_aspect:   [ Bool, false ],
      aspect_scale:   [ Float, 1 ],
    }))
  }
}
