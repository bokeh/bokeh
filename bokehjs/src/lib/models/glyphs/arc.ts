import {XYGlyph, XYGlyphView} from "./xy_glyph"
import {inherit} from "./glyph"
import {generic_line_vector_legend} from "./utils"
import {LineVector} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type {Rect} from "core/types"
import {to_screen} from "core/types"
import {Direction} from "core/enums"
import * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import {to_cartesian, PI} from "core/util/math"

export interface ArcView extends Arc.Data {}

export class ArcView extends XYGlyphView {
  declare model: Arc
  declare visuals: Arc.Visuals

  protected override _map_data(): void {
    this._define_or_inherit_attr<Arc.Data>("sradius", () => {
      if (this.model.properties.radius.units == "data") {
        if (this.inherited_x && this.inherited_radius) {
          return inherit
        } else {
          return this.sdist(this.renderer.xscale, this.x, this.radius)
        }
      } else {
        return this.inherited_radius ? inherit : to_screen(this.radius)
      }
    })
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<Arc.Data>): void {
    if (!this.visuals.line.doit) {
      return
    }

    const {sx, sy, sradius, start_angle, end_angle} = {...this, ...data}
    const anticlock = this.model.direction == "anticlock"

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const sradius_i = sradius[i]
      const start_angle_i = start_angle.get(i)
      const end_angle_i = end_angle.get(i)

      if (!isFinite(sx_i + sy_i + sradius_i + start_angle_i + end_angle_i)) {
        continue
      }

      ctx.beginPath()
      ctx.arc(sx_i, sy_i, sradius_i, start_angle_i, end_angle_i, anticlock)
      this.visuals.line.apply(ctx, i)

      this._render_decorations(ctx, i, sx_i, sy_i, sradius_i, start_angle_i, end_angle_i, anticlock)
    }
  }

  protected _render_decorations(ctx: Context2d, i: number, sx: number, sy: number, sradius: number,
      start_angle: number, end_angle: number, _anticlock: boolean): void {

    for (const decoration of this.decorations.values()) {
      ctx.save()

      switch (decoration.model.node) {
        case "start": {
          const {x, y} = to_cartesian(sradius, start_angle)
          ctx.translate(sx + x, sy + y)
          ctx.rotate(start_angle + PI)
          break
        }
        case "middle": {
          const angle = (start_angle + end_angle)/2
          const {x, y} = to_cartesian(sradius, angle)
          ctx.translate(sx + x, sy + y)
          ctx.rotate(angle)
          break
        }
        case "end": {
          const {x, y} = to_cartesian(sradius, end_angle)
          ctx.translate(sx + x, sy + y)
          ctx.rotate(end_angle)
          break
        }
      }

      decoration.marking.paint(ctx, i)
      ctx.restore()
    }
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_vector_legend(this.visuals, ctx, bbox, index)
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

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineVector}

  export type Data = p.GlyphDataOf<Props>
}

export interface Arc extends Arc.Attrs {}

export class Arc extends XYGlyph {
  declare properties: Arc.Props
  declare __view_type__: ArcView

  constructor(attrs?: Partial<Arc.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ArcView

    this.mixins<Arc.Mixins>(LineVector)

    this.define<Arc.Props>(({}) => ({
      direction:   [ Direction, "anticlock" ],
      radius:      [ p.DistanceSpec, {field: "radius"} ],
      start_angle: [ p.AngleSpec, {field: "start_angle"} ],
      end_angle:   [ p.AngleSpec, {field: "end_angle"} ],
    }))
  }
}
