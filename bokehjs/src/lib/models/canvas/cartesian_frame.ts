import {CategoricalScale} from "../scales/categorical_scale"
import {LinearScale} from "../scales/linear_scale"
import {LogScale} from "../scales/log_scale"
import {Scale} from "../scales/scale"
import {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import {DataRange1d} from "../ranges/data_range1d"
import {FactorRange} from "../ranges/factor_range"

import {LayoutCanvas} from "core/layout/layout_canvas"
import {Variable} from "core/layout/solver"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export type Ranges = {[key: string]: Range}
export type Scales = {[key: string]: Scale}

export namespace CartesianFrame {
  export interface Attrs extends LayoutCanvas.Attrs {
    extra_x_ranges: Ranges
    extra_y_ranges: Ranges
    x_range: Range
    y_range: Range
    x_scale: Scale
    y_scale: Scale
  }

  export interface Props extends LayoutCanvas.Props {}
}

export interface CartesianFrame extends CartesianFrame.Attrs {}

export class CartesianFrame extends LayoutCanvas {

  constructor(attrs?: Partial<CartesianFrame.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "CartesianFrame"

    this.internal({
      extra_x_ranges: [ p.Any, {} ],
      extra_y_ranges: [ p.Any, {} ],
      x_range:        [ p.Instance ],
      y_range:        [ p.Instance ],
      x_scale:        [ p.Instance ],
      y_scale:        [ p.Instance ],
    })
  }

  protected _h_target: Range1d
  protected _v_target: Range1d

  protected _x_ranges: Ranges
  protected _y_ranges: Ranges

  protected _xscales: Scales
  protected _yscales: Scales

  initialize(): void {
    super.initialize()
    this._configure_scales()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.change, () => this._configure_scales())
  }

  get panel(): LayoutCanvas {
    return this
  }

  get_editables(): Variable[] {
    return super.get_editables().concat([this._width, this._height])
  }

  map_to_screen(x: Arrayable<number>, y: Arrayable<number>,
                x_name: string = "default", y_name: string = "default"): [Arrayable<number>, Arrayable<number>] {
    const sx = this.xscales[x_name].v_compute(x)
    const sy = this.yscales[y_name].v_compute(y)
    return [sx, sy]
  }

  protected _get_ranges(range: Range, extra_ranges?: Ranges): Ranges {
    const ranges: Ranges = {}
    ranges["default"] = range
    if (extra_ranges != null) {
      for (const name in extra_ranges)
        ranges[name] = extra_ranges[name]
    }
    return ranges
  }

  protected _get_scales(scale: Scale, ranges: Ranges, frame_range: Range): Scales {
    const scales: Scales = {}

    for (const name in ranges) {
      const range = ranges[name]

      if (range instanceof DataRange1d || range instanceof Range1d) {
        if (!(scale instanceof LogScale) && !(scale instanceof LinearScale))
          throw new Error(`Range ${range.type} is incompatible is Scale ${scale.type}`)
        // XXX: special case because CategoricalScale is a subclass of LinearScale, should be removed in future
        if (scale instanceof CategoricalScale)
          throw new Error(`Range ${range.type} is incompatible is Scale ${scale.type}`)
      }

      if (range instanceof FactorRange) {
        if (!(scale instanceof CategoricalScale))
          throw new Error(`Range ${range.type} is incompatible is Scale ${scale.type}`)
      }

      if (scale instanceof LogScale && range instanceof DataRange1d)
        range.scale_hint = "log"

      const s = scale.clone()
      s.setv({source_range: range, target_range: frame_range})
      scales[name] = s
    }

    return scales
  }

  protected _configure_frame_ranges(): void {
    // data to/from screen space transform (left-bottom <-> left-top origin)
    this._h_target = new Range1d({start: this._left.value, end: this._right.value})
    this._v_target = new Range1d({start: this._bottom.value, end: this._top.value})
  }

  protected _configure_scales(): void {
    this._configure_frame_ranges()

    this._x_ranges = this._get_ranges(this.x_range, this.extra_x_ranges)
    this._y_ranges = this._get_ranges(this.y_range, this.extra_y_ranges)

    this._xscales = this._get_scales(this.x_scale, this._x_ranges, this._h_target)
    this._yscales = this._get_scales(this.y_scale, this._y_ranges, this._v_target)
  }

  update_scales(): void {
    this._configure_frame_ranges()

    for (const name in this._xscales) {
      const scale = this._xscales[name]
      scale.target_range = this._h_target
    }

    for (const name in this._yscales) {
      const scale = this._yscales[name]
      scale.target_range = this._v_target
    }
  }

  get x_ranges(): Ranges {
    return this._x_ranges
  }

  get y_ranges(): Ranges {
    return this._y_ranges
  }

  get xscales(): Scales {
    return this._xscales
  }

  get yscales(): Scales {
    return this._yscales
  }
}

CartesianFrame.initClass()
