import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import * as p from "core/properties"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import {NumberArray} from "core/types"
import {Context2d} from "core/util/canvas"
import {catmullrom_spline} from "core/util/interpolation"

export type SplineData = XYGlyphData & {
  _xt: NumberArray
  _yt: NumberArray
  sxt: NumberArray
  syt: NumberArray
}

export interface SplineView extends SplineData {}

export class SplineView extends XYGlyphView {
  model: Spline
  visuals: Spline.Visuals

  protected _set_data(): void {
    const {tension, closed} = this.model
    ;[this._xt, this._yt] = catmullrom_spline(this._x, this._y, 20, tension, closed)
  }

  protected _map_data(): void {
    const {x_scale, y_scale} = this.renderer.coordinates
    this.sxt = x_scale.v_compute(this._xt)
    this.syt = y_scale.v_compute(this._yt)
  }

  protected _render(ctx: Context2d, _indices: number[], {sxt: sx, syt: sy}: SplineData): void {
    this.visuals.line.set_value(ctx)

    const n = sx.length
    for (let j = 0; j < n; j++) {
      if (j == 0) {
        ctx.beginPath()
        ctx.moveTo(sx[j], sy[j])
        continue
      } else if (isNaN(sx[j]) || isNaN(sy[j])) {
        ctx.stroke()
        ctx.beginPath()
        continue
      } else
        ctx.lineTo(sx[j], sy[j])
    }
    ctx.stroke()
  }
}

export namespace Spline {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & Mixins & {
    tension: p.Property<number>
    closed: p.Property<boolean>
  }

  export type Mixins = mixins.Line/*Scalar*/

  export type Visuals = XYGlyph.Visuals & {line: visuals.Line}
}

export interface Spline extends Spline.Attrs {}

export class Spline extends XYGlyph {
  properties: Spline.Props
  __view_type__: SplineView

  constructor(attrs?: Partial<Spline.Attrs>) {
    super(attrs)
  }

  static init_Spline(): void {
    this.prototype.default_view = SplineView

    this.mixins<Spline.Mixins>(mixins.Line/*Scalar*/)

    this.define<Spline.Props>(({Boolean, Number}) => ({
      tension: [ Number,  0.5   ],
      closed:  [ Boolean, false ],
    }))
  }
}
