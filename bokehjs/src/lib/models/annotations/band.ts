import {UpperLower, UpperLowerView} from "./upper_lower"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import * as mixins from "core/property_mixins"
import {Line, Fill} from "core/visuals"
import {Dimension} from "core/enums"
import * as p from "core/properties"

export class BandView extends UpperLowerView {
  model: Band
  visuals: Band.Visuals

  connect_signals(): void {
    super.connect_signals()
    const update = () => this.set_data(this.model.source)
    this.connect(this.model.change, update)
    this.connect(this.model.source.streaming, update)
    this.connect(this.model.source.patching, update)
    this.connect(this.model.source.change, update)
  }

  protected _render(): void {
    this._map_data()

    const {ctx} = this.layer

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

    if (this.visuals.fill.doit) {
      this.visuals.fill.set_value(ctx)
      ctx.fill()
    }

    // Draw the lower band edge
    ctx.beginPath()
    ctx.moveTo(this._lower_sx[0], this._lower_sy[0])
    for (let i = 0, end = this._lower_sx.length; i < end; i++) {
      ctx.lineTo(this._lower_sx[i], this._lower_sy[i])
    }

    if (this.visuals.line.doit) {
      this.visuals.line.set_value(ctx)
      ctx.stroke()
    }

    // Draw the upper band edge
    ctx.beginPath()
    ctx.moveTo(this._upper_sx[0], this._upper_sy[0])
    for (let i = 0, end = this._upper_sx.length; i < end; i++) {
      ctx.lineTo(this._upper_sx[i], this._upper_sy[i])
    }

    if (this.visuals.line.doit) {
      this.visuals.line.set_value(ctx)
      ctx.stroke()
    }
  }
}

export namespace Band {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UpperLower.Props & {
    lower: p.DistanceSpec
    upper: p.DistanceSpec
    base: p.DistanceSpec
    dimension: p.Property<Dimension>
    source: p.Property<ColumnarDataSource>
  } & Mixins

  export type Mixins = mixins.Line/*Scalar*/ & mixins.Fill/*Scalar*/

  export type Visuals = UpperLower.Visuals & {line: Line, fill: Fill}
}

export interface Band extends Band.Attrs {}

export class Band extends UpperLower {
  properties: Band.Props
  __view_type__: BandView

  constructor(attrs?: Partial<Band.Attrs>) {
    super(attrs)
  }

  static init_Band(): void {
    this.prototype.default_view = BandView

    this.mixins<Band.Mixins>([mixins.Line/*Scalar*/, mixins.Fill/*Scalar*/])

    this.override({
      fill_color: "#fff9ba",
      fill_alpha: 0.4,
      line_color: "#cccccc",
      line_alpha: 0.3,
    })
  }
}
