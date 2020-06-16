import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {generic_line_legend} from "./utils"
import {LineVector} from "core/property_mixins"
import {Line} from "core/visuals"
import {Rect, NumberArray} from "core/types"
import {Direction} from "core/enums"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"

export interface ArcData extends XYGlyphData {
  _radius: NumberArray
  _start_angle: NumberArray
  _end_angle: NumberArray

  sradius: NumberArray

  max_radius: number
}

export interface ArcView extends ArcData {}

export class ArcView extends XYGlyphView {
  model: Arc
  visuals: Arc.Visuals

  protected _map_data(): void {
    if (this.model.properties.radius.units == "data")
      this.sradius = this.sdist(this.renderer.xscale, this._x, this._radius)
    else
      this.sradius = this._radius
  }

  protected _render(ctx: Context2d, indices: number[],
                    {sx, sy, sradius, _start_angle, _end_angle}: ArcData): void {
    if (this.visuals.line.doit) {
      const direction = this.model.properties.direction.value()

      for (const i of indices) {
        if (isNaN(sx[i] + sy[i] + sradius[i] + _start_angle[i] + _end_angle[i]))
          continue

        ctx.beginPath()
        ctx.arc(sx[i], sy[i], sradius[i], _start_angle[i], _end_angle[i], direction)

        this.visuals.line.set_vectorize(ctx, i)
        ctx.stroke()
      }
    }
  }

  draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Arc {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    direction: p.Property<Direction>
    radius: p.DistanceSpec
    start_angle: p.AngleSpec
    end_angle: p.AngleSpec
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = XYGlyph.Visuals & {line: Line}
}

export interface Arc extends Arc.Attrs {}

export class Arc extends XYGlyph {
  properties: Arc.Props
  __view_type__: ArcView

  constructor(attrs?: Partial<Arc.Attrs>) {
    super(attrs)
  }

  static init_Arc(): void {
    this.prototype.default_view = ArcView

    this.mixins<Arc.Mixins>(LineVector)

    this.define<Arc.Props>({
      direction:   [ p.Direction,   'anticlock' ],
      radius:      [ p.DistanceSpec             ],
      start_angle: [ p.AngleSpec                ],
      end_angle:   [ p.AngleSpec                ],
    })
  }
}
