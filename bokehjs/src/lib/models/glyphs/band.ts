import {Glyph, GlyphView} from "./glyph"
import type {Context2d} from "core/util/canvas"
import type {SpatialIndex} from "core/util/spatial"
import type {Arrayable} from "core/types"
import {Dimension} from "core/enums"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import * as p from "core/properties"

export interface BandView extends Band.Data {}

export class BandView extends GlyphView {
  declare model: Band
  declare visuals: Band.Visuals

  protected _index_data(index: SpatialIndex): void {
    const {data_size} = this
    const {dimension} = this.model

    const [i, j] = dimension == "width" ? [0, 1] : [1, 0]
    const lower = [this.lower, this.base]
    const upper = [this.upper, this.base]

    const lower_x = lower[i]
    const lower_y = lower[j]

    const upper_x = upper[i]
    const upper_y = upper[j]

    for (let i = 0; i < data_size; i++) {
      const x0 = lower_x[i]
      const y0 = lower_y[i]
      const x1 = upper_x[i]
      const y1 = upper_y[i]
      index.add_rect(x0, y0, x1, y1)
    }
  }

  scenterxy(_i: number): [number, number] {
    return [NaN, NaN] // TODO
  }

  override _map_data(): void {
    super._map_data()

    const {dimension} = this.model
    const [i, j] = dimension == "width" ? [0, 1] : [1, 0]

    const slower = [this.slower, this.sbase]
    const supper = [this.supper, this.sbase]

    this._define_attr<Band.Data>("lower_sx", slower[i])
    this._define_attr<Band.Data>("lower_sy", slower[j])

    this._define_attr<Band.Data>("upper_sx", supper[i])
    this._define_attr<Band.Data>("upper_sy", supper[j])
  }

  protected _paint(ctx: Context2d, _indices: number[], data?: Band.Data): void {
    const {lower_sx, lower_sy, upper_sx, upper_sy} = {...this, ...data}

    const n_lower = lower_sx.length
    const n_upper = upper_sx.length

    // Draw the band body
    ctx.beginPath()
    ctx.moveTo(lower_sx[0], lower_sy[0])

    for (let i = 0; i < n_lower; i++) {
      ctx.lineTo(lower_sx[i], lower_sy[i])
    }
    // iterate backwards so that the upper end is below the lower start
    for (let i = n_upper - 1; i >= 0; i--) {
      ctx.lineTo(upper_sx[i], upper_sy[i])
    }

    ctx.closePath()
    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)

    // Draw the lower band edge
    ctx.beginPath()
    ctx.moveTo(lower_sx[0], lower_sy[0])
    for (let i = 0; i < n_lower; i++) {
      ctx.lineTo(lower_sx[i], lower_sy[i])
    }
    this.visuals.line.apply(ctx)

    // Draw the upper band edge
    ctx.beginPath()
    ctx.moveTo(upper_sx[0], upper_sy[0])
    for (let i = 0; i < n_upper; i++) {
      ctx.lineTo(upper_sx[i], upper_sy[i])
    }
    this.visuals.line.apply(ctx)
  }
}

export namespace Band {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    dimension: p.Property<Dimension>
    lower: p.XOrYCoordinateSpec
    upper: p.XOrYCoordinateSpec
    base: p.XOrYCrossCoordinateSpec
  } & Mixins

  export type Mixins =
    mixins.LineScalar &
    mixins.FillScalar &
    mixins.HatchScalar

  export type Visuals = Glyph.Visuals & {
    line: visuals.LineScalar
    fill: visuals.FillScalar
    hatch: visuals.HatchScalar
  }

  export type Data = p.GlyphDataOf<Props> & {
    readonly lower_sx: Arrayable<number>
    readonly lower_sy: Arrayable<number>
    readonly upper_sx: Arrayable<number>
    readonly upper_sy: Arrayable<number>
  }
}

export interface Band extends Band.Attrs {}

export class Band extends Glyph {
  declare properties: Band.Props
  declare __view_type__: BandView

  constructor(attrs?: Partial<Band.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BandView

    this.mixins<Band.Mixins>([mixins.LineScalar, mixins.FillScalar, mixins.HatchScalar])

    this.define<Band.Props>(() => ({
      dimension: [ Dimension, "height" ],
      lower:     [ p.XOrYCoordinateSpec, {field: "lower"} ],
      upper:     [ p.XOrYCoordinateSpec, {field: "upper"} ],
      base:      [ p.XOrYCrossCoordinateSpec, {field: "base"} ],
    }))

    this.override<Band.Props>({
      fill_color: "#fff9ba",
      fill_alpha: 0.4,
      line_color: "#cccccc",
      line_alpha: 0.3,
    })
  }
}
