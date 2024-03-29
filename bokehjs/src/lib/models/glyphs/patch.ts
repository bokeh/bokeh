import {XYGlyph, XYGlyphView} from "./xy_glyph"
import {generic_area_scalar_legend} from "./utils"
import type {PointGeometry} from "core/geometry"
import type * as visuals from "core/visuals"
import type {Rect} from "core/types"
import type {Context2d} from "core/util/canvas"
import * as hittest from "core/hittest"
import * as mixins from "core/property_mixins"
import type * as p from "core/properties"
import {Selection} from "../selections/selection"

export interface PatchView extends Patch.Data {}

export class PatchView extends XYGlyphView {
  declare model: Patch
  declare visuals: Patch.Visuals

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<Patch.Data>): void {
    const {sx, sy} = {...this, ...data}

    let move = true
    ctx.beginPath()

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]

      if (!isFinite(sx_i + sy_i)) {
        ctx.closePath()
        move = true
      } else {
        if (move) {
          ctx.moveTo(sx_i, sy_i)
          move = false
        } else {
          ctx.lineTo(sx_i, sy_i)
        }
      }
    }

    ctx.closePath()

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, _index: number): void {
    generic_area_scalar_legend(this.visuals, ctx, bbox)
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const result = new Selection()

    if (hittest.point_in_poly(geometry.sx, geometry.sy, this.sx, this.sy)) {
      result.add_to_selected_glyphs(this.model)
      result.view = this
    }

    return result
  }
}

export namespace Patch {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & Mixins

  export type Mixins = mixins.LineScalar & mixins.FillScalar & mixins.HatchScalar

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineScalar, fill: visuals.FillScalar, hatch: visuals.HatchScalar}

  export type Data = p.GlyphDataOf<Props>
}

export interface Patch extends Patch.Attrs {}

export class Patch extends XYGlyph {
  declare properties: Patch.Props
  declare __view_type__: PatchView

  constructor(attrs?: Partial<Patch.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PatchView

    this.mixins<Patch.Mixins>([mixins.LineScalar, mixins.FillScalar, mixins.HatchScalar])
  }
}
