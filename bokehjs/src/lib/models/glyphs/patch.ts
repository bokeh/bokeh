import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {generic_area_legend} from "./utils"
import {PointGeometry} from "core/geometry"
import {Line, Fill, Hatch} from "core/visuals"
import {Arrayable, Rect} from "core/types"
import {Context2d} from "core/util/canvas"
import * as hittest from "core/hittest"
import * as mixins from "core/property_mixins"
import * as p from "core/properties"
import {Selection} from "../selections/selection"

export interface PatchData extends XYGlyphData {}

export interface PatchView extends PatchData {}

export class PatchView extends XYGlyphView {
  model: Patch
  visuals: Patch.Visuals

  protected _inner_loop(ctx: Context2d, indices: number[], sx: Arrayable<number>, sy: Arrayable<number>, func: (this: Context2d) => void): void {
    for (const i of indices) {
      if (i == 0) {
        ctx.beginPath()
        ctx.moveTo(sx[i], sy[i])
        continue
      } else if (isNaN(sx[i] + sy[i])) {
        ctx.closePath()
        func.apply(ctx)
        ctx.beginPath()
        continue
      } else
        ctx.lineTo(sx[i], sy[i])
    }
    ctx.closePath()
    func.call(ctx)
  }
  protected _render(ctx: Context2d, indices: number[], {sx, sy}: PatchData): void {
    if (this.visuals.fill.doit) {
      this.visuals.fill.set_value(ctx)
      this._inner_loop(ctx, indices, sx, sy, ctx.fill)
    }

    this.visuals.hatch.doit2(ctx, 0, () => this._inner_loop(ctx, indices, sx, sy, ctx.fill), () => this.renderer.request_render())

    if (this.visuals.line.doit) {
      this.visuals.line.set_value(ctx)
      this._inner_loop(ctx, indices, sx, sy, ctx.stroke)
    }
  }

  draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_area_legend(this.visuals, ctx, bbox, index)
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

  export type Mixins = mixins.Line/*Scalar*/ & mixins.Fill/*Scalar*/ & mixins.Hatch/*Scalar*/

  export type Visuals = XYGlyph.Visuals & {line: Line, fill: Fill, hatch: Hatch}
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

    this.mixins<Patch.Mixins>([mixins.Line/*Scalar*/, mixins.Fill/*Scalar*/, mixins.Hatch/*Scalar*/])
  }
}
