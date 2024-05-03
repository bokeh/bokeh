import {UpperLower, UpperLowerView} from "./upper_lower"
import type {Context2d} from "core/util/canvas"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"

export class BandView extends UpperLowerView {
  declare model: Band
  declare visuals: Band.Visuals

  _paint_data(ctx: Context2d): void {
    // Draw the band body
    ctx.beginPath()
    ctx.moveTo(this._lower_sx[0], this._lower_sy[0])

    for (let i = 0, end = this._lower_sx.length; i < end; i++) {
      ctx.lineTo(this._lower_sx[i], this._lower_sy[i])
    }
    // iterate backwards so that the upper end is below the lower start
    for (let i = this._upper_sx.length-1; i >= 0; i--) {
      ctx.lineTo(this._upper_sx[i], this._upper_sy[i])
    }

    ctx.closePath()
    this.visuals.fill.apply(ctx)

    // Draw the lower band edge
    ctx.beginPath()
    ctx.moveTo(this._lower_sx[0], this._lower_sy[0])
    for (let i = 0, end = this._lower_sx.length; i < end; i++) {
      ctx.lineTo(this._lower_sx[i], this._lower_sy[i])
    }

    this.visuals.line.apply(ctx)

    // Draw the upper band edge
    ctx.beginPath()
    ctx.moveTo(this._upper_sx[0], this._upper_sy[0])
    for (let i = 0, end = this._upper_sx.length; i < end; i++) {
      ctx.lineTo(this._upper_sx[i], this._upper_sy[i])
    }

    this.visuals.line.apply(ctx)
  }
}

export namespace Band {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UpperLower.Props & Mixins

  export type Mixins = mixins.Line & mixins.Fill

  export type Visuals = UpperLower.Visuals & {line: visuals.Line, fill: visuals.Fill}
}

export interface Band extends Band.Attrs {}

export class Band extends UpperLower {
  declare properties: Band.Props
  declare __view_type__: BandView

  constructor(attrs?: Partial<Band.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BandView

    this.mixins<Band.Mixins>([mixins.Line, mixins.Fill])

    this.override<Band.Props>({
      fill_color: "#fff9ba",
      fill_alpha: 0.4,
      line_color: "#cccccc",
      line_alpha: 0.3,
    })
  }
}
