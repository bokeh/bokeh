import {UpperLower, UpperLowerView} from "./upper_lower"
import type {ArrowHeadView} from "./arrow_head"
import {ArrowHead, TeeHead} from "./arrow_head"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import {Indices} from "core/types"
import type {Context2d} from "core/util/canvas"
import type {IterViews} from "core/build_views"
import {build_view} from "core/build_views"
import {LineVector} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"

export class WhiskerView extends UpperLowerView {
  declare model: Whisker
  declare visuals: Whisker.Visuals

  protected lower_head: ArrowHeadView | null
  protected upper_head: ArrowHeadView | null

  override *children(): IterViews {
    yield* super.children()

    const {lower_head, upper_head} = this
    if (lower_head != null) {
      yield lower_head
    }
    if (upper_head != null) {
      yield upper_head
    }
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {lower_head, upper_head} = this.model
    if (lower_head != null) {
      this.lower_head = await build_view(lower_head, {parent: this})
    }
    if (upper_head != null) {
      this.upper_head = await build_view(upper_head, {parent: this})
    }
  }

  override set_data(source: ColumnarDataSource): void {
    super.set_data(source)
    const indices = Indices.all_set(this._lower.length)
    this.lower_head?.set_data(source, indices)
    this.upper_head?.set_data(source, indices)
  }

  _paint_data(ctx: Context2d): void {
    if (this.visuals.line.doit) {
      for (let i = 0, end = this._lower_sx.length; i < end; i++) {
        ctx.beginPath()
        ctx.moveTo(this._lower_sx[i], this._lower_sy[i])
        ctx.lineTo(this._upper_sx[i], this._upper_sy[i])
        this.visuals.line.apply(ctx, i)
      }
    }

    const angle = this.model.dimension == "height" ? 0 : Math.PI / 2

    if (this.lower_head != null) {
      for (let i = 0, end = this._lower_sx.length; i < end; i++) {
        ctx.save()
        ctx.translate(this._lower_sx[i], this._lower_sy[i])
        ctx.rotate(angle + Math.PI)
        this.lower_head.paint(ctx, i)
        ctx.restore()
      }

      this.lower_head.mark_finished()
    }

    if (this.upper_head != null) {
      for (let i = 0, end = this._upper_sx.length; i < end; i++) {
        ctx.save()
        ctx.translate(this._upper_sx[i], this._upper_sy[i])
        ctx.rotate(angle)
        this.upper_head.paint(ctx, i)
        ctx.restore()
      }

      this.upper_head.mark_finished()
    }
  }
}

export namespace Whisker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UpperLower.Props & {
    lower_head: p.Property<ArrowHead | null>
    upper_head: p.Property<ArrowHead | null>
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = UpperLower.Visuals & {line: visuals.LineVector}
}

export interface Whisker extends Whisker.Attrs {}

export class Whisker extends UpperLower {
  declare properties: Whisker.Props
  declare __view_type__: WhiskerView

  constructor(attrs?: Partial<Whisker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = WhiskerView

    this.mixins<Whisker.Mixins>(LineVector)

    this.define<Whisker.Props>(({Ref, Nullable}) => ({
      lower_head: [ Nullable(Ref(ArrowHead)), () => new TeeHead({size: 10}) ],
      upper_head: [ Nullable(Ref(ArrowHead)), () => new TeeHead({size: 10}) ],
    }))

    this.override<Whisker.Props>({
      level: "underlay",
    })
  }
}
