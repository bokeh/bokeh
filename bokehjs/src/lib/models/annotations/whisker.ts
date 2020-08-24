import {UpperLower, UpperLowerView} from "./upper_lower"
import {ArrowHead, TeeHead} from "./arrow_head"
import {LineVector} from "core/property_mixins"
import {Line} from "core/visuals"
import * as p from "core/properties"

export class WhiskerView extends UpperLowerView {
  model: Whisker
  visuals: Whisker.Visuals

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

    if (this.model.lower_head != null) {
      for (let i = 0, end = this._lower_sx.length; i < end; i++) {
        ctx.save()
        ctx.translate(this._lower_sx[i], this._lower_sy[i])
        ctx.rotate(angle + Math.PI)
        this.model.lower_head.render(ctx, i)
        ctx.restore()
      }
    }

    if (this.model.upper_head != null) {
      for (let i = 0, end = this._upper_sx.length; i < end; i++) {
        ctx.save()
        ctx.translate(this._upper_sx[i], this._upper_sy[i])
        ctx.rotate(angle)
        this.model.upper_head.render(ctx, i)
        ctx.restore()
      }
    }
  }
}

export namespace Whisker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UpperLower.Props & {
    lower_head: p.Property<ArrowHead>
    upper_head: p.Property<ArrowHead>
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = UpperLower.Visuals & {line: Line}
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

    this.define<Whisker.Props>({
      lower_head:   [ p.Instance,     () => new TeeHead({level: "underlay", size: 10}) ],
      upper_head:   [ p.Instance,     () => new TeeHead({level: "underlay", size: 10}) ],
    })

    this.override({
      level: 'underlay',
    })
  }
}
