import {Model} from "../../model"
import {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import {Scale} from "../scales/scale"
import {PlotView} from "../plots/plot"
import {View} from "core/view"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export class ScopeView extends View {
  model: Scope
  parent: PlotView

  get x_range(): Range { return this.model.x_range }
  get y_range(): Range { return this.model.y_range }

  get ranges(): [Range, Range] {
    return [this.model.x_range, this.model.y_range]
  }

  private _x_scale: Scale
  private _y_scale: Scale

  get x_scale(): Scale { return this._x_scale }
  get y_scale(): Scale { return this._y_scale }

  get scales(): [Scale, Scale] {
    return [this.x_scale, this.y_scale]
  }

  map_to_screen(xs: Arrayable<number>, ys: Arrayable<number>): [Arrayable<number>, Arrayable<number>] {
    const sxs = this.x_scale.v_compute(xs)
    const sys = this.y_scale.v_compute(ys)
    return [sxs, sys]
  }

  map_from_screen(sxs: Arrayable<number>, sys: Arrayable<number>): [Arrayable<number>, Arrayable<number>] {
    const xs = this.x_scale.v_invert(sxs)
    const ys = this.y_scale.v_invert(sys)
    return [xs, ys]
  }

  initialize(): void {
    super.initialize()
    this._configure_scales()
  }

  /*protected*/ _configure_scales(): void {
    const {outer} = this.model
    const {scope_views, frame} = this.parent

    const outer_view = outer != null ? scope_views[outer.id] : frame

    const {x_range, x_scale, x_target} = this.model
    const {y_range, y_scale, y_target} = this.model

    this._x_scale = this._configure_scale(x_scale, x_range, x_target, outer_view.x_scale)
    this._y_scale = this._configure_scale(y_scale, y_range, y_target, outer_view.y_scale)
  }

  protected _configure_scale(scale: Scale, source_range: Range, target_range: Range1d | null, outer_scale: Scale): Scale {
    const target = target_range || outer_scale.source_range

    const start = outer_scale.compute(target.start)
    const end = outer_scale.compute(target.end)

    const screen_range = new Range1d({start, end})

    const transform = scale.clone()
    transform.setv({source_range, target_range: screen_range})
    return transform
  }
}

export namespace Scope {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    x_range: p.Property<Range>
    y_range: p.Property<Range>
    x_scale: p.Property<Scale>
    y_scale: p.Property<Scale>
    x_target: p.Property<Range1d | null>
    y_target: p.Property<Range1d | null>
    outer: p.Property<Scope | null>
  }
}

export interface Scope extends Scope.Attrs {}

export class Scope extends Model {
  properties: Scope.Props

  constructor(attrs?: Partial<Scope.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Scope"
    this.prototype.default_view = ScopeView

    this.define<Scope.Props>({
      x_range:  [ p.Instance ],
      y_range:  [ p.Instance ],
      x_scale:  [ p.Instance ],
      y_scale:  [ p.Instance ],
      x_target: [ p.Instance ],
      y_target: [ p.Instance ],
      outer:    [ p.Instance ],
    })
  }
}
Scope.initClass()
