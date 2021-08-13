import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import * as p from "core/properties"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import {FloatArray, ScreenArray} from "core/types"
import {Context2d} from "core/util/canvas"
import {catmullrom_spline} from "core/util/interpolation"

export type SplineData = XYGlyphData & {
  _xt: FloatArray
  _yt: FloatArray
  sxt: ScreenArray
  syt: ScreenArray
}

export interface SplineView extends SplineData {}

export class SplineView extends XYGlyphView {
  override model: Spline
  override visuals: Spline.Visuals

  protected override _set_data(): void {
    const {tension, closed} = this.model
    ;[this._xt, this._yt] = catmullrom_spline(this._x, this._y, 20, tension, closed)
  }

  protected override _map_data(): void {
    const {x_scale, y_scale} = this.renderer.coordinates
    this.sxt = x_scale.v_compute(this._xt)
    this.syt = y_scale.v_compute(this._yt)
  }

  protected _render(ctx: Context2d, _indices: number[], data?: SplineData): void {
    const {sxt: sx, syt: sy} = data ?? this

    let move = true
    ctx.beginPath()

    const n = sx.length
    for (let j = 0; j < n; j++) {
      const sx_i = sx[j]
      const sy_i = sy[j]

      if (!isFinite(sx_i + sy_i))
        move = true
      else {
        if (move) {
          ctx.moveTo(sx_i, sy_i)
          move = false
        } else
          ctx.lineTo(sx_i, sy_i)
      }
    }

    this.visuals.line.set_value(ctx)
    ctx.stroke()
  }
}

export namespace Spline {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & Mixins & {
    tension: p.Property<number>
    closed: p.Property<boolean>
  }

  export type Mixins = mixins.LineScalar

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineScalar}
}

export interface Spline extends Spline.Attrs {}

export class Spline extends XYGlyph {
  override properties: Spline.Props
  override __view_type__: SplineView

  constructor(attrs?: Partial<Spline.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SplineView

    this.mixins<Spline.Mixins>(mixins.LineScalar)

    this.define<Spline.Props>(({Boolean, Number}) => ({
      tension: [ Number,  0.5   ],
      closed:  [ Boolean, false ],
    }))
  }
}
