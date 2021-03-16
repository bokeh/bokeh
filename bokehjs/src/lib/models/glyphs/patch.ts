import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {generic_area_scalar_legend} from "./utils"
import {PointGeometry} from "core/geometry"
import * as visuals from "core/visuals"
import {Rect} from "core/types"
import {Context2d} from "core/util/canvas"
import * as hittest from "core/hittest"
import * as mixins from "core/property_mixins"
import * as p from "core/properties"
import {Selection} from "../selections/selection"

export type PatchData = XYGlyphData & p.UniformsOf<Patch.Mixins>

export interface PatchView extends PatchData {}

export class PatchView extends XYGlyphView {
  model: Patch
  visuals: Patch.Visuals

  protected _render(ctx: Context2d, indices: number[], data?: PatchData): void {
    const {sx, sy} = data ?? this

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
        } else
          ctx.lineTo(sx_i, sy_i)
      }
    }

    ctx.closePath()

    if (this.visuals.fill.doit) {
      this.visuals.fill.set_value(ctx)
      ctx.fill()
    }

    if (this.visuals.hatch.doit) {
      this.visuals.hatch.set_value(ctx)
      ctx.fill()
    }

    if (this.visuals.line.doit) {
      this.visuals.line.set_value(ctx)
      ctx.stroke()
    }
  }

  draw_legend_for_index(ctx: Context2d, bbox: Rect, _index: number): void {
    generic_area_scalar_legend(this.visuals, ctx, bbox)
  }

  protected _hit_point(geometry: PointGeometry): Selection {
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
}

export interface Patch extends Patch.Attrs {}

export class Patch extends XYGlyph {
  properties: Patch.Props
  __view_type__: PatchView

  constructor(attrs?: Partial<Patch.Attrs>) {
    super(attrs)
  }

  static init_Patch(): void {
    this.prototype.default_view = PatchView

    this.mixins<Patch.Mixins>([mixins.LineScalar, mixins.FillScalar, mixins.HatchScalar])
  }
}
