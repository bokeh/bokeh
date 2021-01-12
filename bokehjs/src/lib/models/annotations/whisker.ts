import {UpperLower, UpperLowerView} from "./upper_lower"
import {ArrowHead, ArrowHeadView, TeeHead} from "./arrow_head"
import {build_view} from "core/build_views"
import {LineVector} from "core/property_mixins"
import * as visuals from "core/visuals"
import * as p from "core/properties"

export class WhiskerView extends UpperLowerView {
  model: Whisker
  visuals: Whisker.Visuals

  protected lower_head: ArrowHeadView | null
  protected upper_head: ArrowHeadView | null

  async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {lower_head, upper_head} = this.model
    if (lower_head != null)
      this.lower_head = await build_view(lower_head, {parent: this})
    if (upper_head != null)
      this.upper_head = await build_view(upper_head, {parent: this})
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.source.streaming, () => this.set_data(this.model.source))
    this.connect(this.model.source.patching, () => this.set_data(this.model.source))
    this.connect(this.model.source.change, () => this.set_data(this.model.source))
  }

  protected _render(): void {
    this._map_data()

    const {ctx} = this.layer

    if (this.visuals.line.doit) {
      for (let i = 0, end = this._lower_sx.length; i < end; i++) {
        this.visuals.line.set_vectorize(ctx, i)
        ctx.beginPath()
        ctx.moveTo(this._lower_sx[i], this._lower_sy[i])
        ctx.lineTo(this._upper_sx[i], this._upper_sy[i])
        ctx.stroke()
      }
    }

    const angle = this.model.dimension == "height" ? 0 : Math.PI / 2

    if (this.lower_head != null) {
      for (let i = 0, end = this._lower_sx.length; i < end; i++) {
        ctx.save()
        ctx.translate(this._lower_sx[i], this._lower_sy[i])
        ctx.rotate(angle + Math.PI)
        this.lower_head.render(ctx, i)
        ctx.restore()
      }
    }

    if (this.upper_head != null) {
      for (let i = 0, end = this._upper_sx.length; i < end; i++) {
        ctx.save()
        ctx.translate(this._upper_sx[i], this._upper_sy[i])
        ctx.rotate(angle)
        this.upper_head.render(ctx, i)
        ctx.restore()
      }
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
  properties: Whisker.Props
  __view_type__: WhiskerView

  constructor(attrs?: Partial<Whisker.Attrs>) {
    super(attrs)
  }

  static init_Whisker(): void {
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
