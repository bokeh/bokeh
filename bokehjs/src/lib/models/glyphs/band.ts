import {Glyph, GlyphView} from "./glyph"
import {generic_area_scalar_legend} from "./utils"
import type {Arrayable, Rect} from "core/types"
import {Dimension} from "core/enums"
import type {SpatialIndex} from "core/util/spatial"
import type {Context2d} from "core/util/canvas"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import * as p from "core/properties"

export interface BandGlyphView extends BandGlyph.Data {}

export class BandGlyphView extends GlyphView {
  declare model: BandGlyph
  declare visuals: BandGlyph.Visuals

  protected _index_data(index: SpatialIndex): void {
    const {min, max} = Math
    const {data_size} = this
    const {dimension} = this.model

    const [i, j] = dimension == "width" ? [0, 1] : [1, 0]
    const lower = [this.lower, this.base]
    const upper = [this.upper, this.base]

    const lower_x = lower[i]
    const lower_y = lower[j]
    const upper_x = upper[i]
    const upper_y = upper[j]

    for (let k = 0; k < data_size; k++) {
      const x0 = lower_x[k]
      const y0 = lower_y[k]
      const x1 = upper_x[k]
      const y1 = upper_y[k]
      index.add_rect(min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1))
    }
  }

  protected override _map_data(): void {
    const {dimension} = this.model
    const [i, j] = dimension == "width" ? [0, 1] : [1, 0]

    const slower = [this.slower, this.sbase]
    const supper = [this.supper, this.sbase]

    this._define_attr<BandGlyph.Data>("lower_sx", slower[i])
    this._define_attr<BandGlyph.Data>("lower_sy", slower[j])
    this._define_attr<BandGlyph.Data>("upper_sx", supper[i])
    this._define_attr<BandGlyph.Data>("upper_sy", supper[j])
  }

  scenterxy(i: number): [number, number] {
    const sx = (this.lower_sx[i] + this.upper_sx[i])/2
    const sy = (this.lower_sy[i] + this.upper_sy[i])/2
    return [sx, sy]
  }

  protected _paint(ctx: Context2d, _indices: Int32Array, data?: Partial<BandGlyph.Data>): void {
    const {lower_sx, lower_sy, upper_sx, upper_sy} = {...this, ...data}

    const n_lower = lower_sx.length
    const n_upper = upper_sx.length

    // Draw the band body
    ctx.beginPath()
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
    for (let i = 0; i < n_lower; i++) {
      ctx.lineTo(lower_sx[i], lower_sy[i])
    }
    this.visuals.line.apply(ctx)

    // Draw the upper band edge
    ctx.beginPath()
    for (let i = 0; i < n_upper; i++) {
      ctx.lineTo(upper_sx[i], upper_sy[i])
    }
    this.visuals.line.apply(ctx)
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, _index: number): void {
    generic_area_scalar_legend(this.visuals, ctx, bbox)
  }
}

export namespace BandGlyph {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    dimension: p.Property<Dimension>
    lower: p.XOrYCoordinateSpec
    upper: p.XOrYCoordinateSpec
    base: p.XOrYCrossCoordinateSpec
  } & Mixins

  export type Mixins = mixins.LineScalar & mixins.FillScalar & mixins.HatchScalar

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

export interface BandGlyph extends BandGlyph.Attrs {}

export class BandGlyph extends Glyph {
  declare properties: BandGlyph.Props
  declare __view_type__: BandGlyphView

  static {
    this.prototype.default_view = BandGlyphView

    this.mixins<BandGlyph.Mixins>([mixins.LineScalar, mixins.FillScalar, mixins.HatchScalar])

    this.define<BandGlyph.Props>(() => ({
      dimension: [ Dimension, "height" ],
      lower:     [ p.XOrYCoordinateSpec, {field: "lower"} ],
      upper:     [ p.XOrYCoordinateSpec, {field: "upper"} ],
      base:      [ p.XOrYCrossCoordinateSpec, {field: "base"} ],
    }))

    this.override<BandGlyph.Props>({
      fill_color: "#fff9ba",
      fill_alpha: 0.4,
      line_color: "#cccccc",
      line_alpha: 0.3,
    })
  }
}
