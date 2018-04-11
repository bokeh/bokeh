import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {generic_line_legend} from "./utils"
import {DistanceSpec, AngleSpec} from "core/vectorization"
import {LineMixinVector} from "core/property_mixins"
import {Line} from "core/visuals"
import {Arrayable} from "core/types"
import {Direction} from "core/enums"
import * as p from "core/properties"
import {IBBox} from "core/util/bbox"
import {Context2d} from "core/util/canvas"

export interface ArcData extends XYGlyphData {
  _radius: Arrayable<number>
  _start_angle: Arrayable<number>
  _end_angle: Arrayable<number>

  sradius: Arrayable<number>

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

  draw_legend_for_index(ctx: Context2d, bbox: IBBox, index: number): void {
    generic_line_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Arc {
  export interface Mixins extends LineMixinVector {}

  export interface Attrs extends XYGlyph.Attrs, Mixins {
    direction: Direction
    radius: DistanceSpec
    start_angle: AngleSpec
    end_angle: AngleSpec
  }

  export interface Props extends XYGlyph.Props {
    direction: p.Property<Direction>
    radius: p.DistanceSpec
    start_angle: p.AngleSpec
    end_angle: p.AngleSpec
  }

  export interface Visuals extends XYGlyph.Visuals {
    line: Line
  }
}

export interface Arc extends Arc.Attrs {}

export class Arc extends XYGlyph {

  properties: Arc.Props

  constructor(attrs?: Partial<Arc.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Arc'
    this.prototype.default_view = ArcView

    this.mixins(['line'])
    this.define({
      direction:   [ p.Direction,   'anticlock' ],
      radius:      [ p.DistanceSpec             ],
      start_angle: [ p.AngleSpec                ],
      end_angle:   [ p.AngleSpec                ],
    })
  }
}
Arc.initClass()
